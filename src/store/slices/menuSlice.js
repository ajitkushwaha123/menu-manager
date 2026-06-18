import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const generateId = () => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
};

const ensureIds = (categories) => {
    if (!Array.isArray(categories)) return [];

    return categories.map(cat => ({
        ...cat,
        id: cat.id || generateId(),
        sub_category: (cat.sub_category || []).map(sub => ({
            ...sub,
            id: sub.id || generateId(),
            items: (sub.items || []).map(item => ({
                ...item,
                id: item.id || generateId(),
                variants: (item.variants || []).map(v => ({
                    ...v,
                    id: v.id || generateId(),
                    options: (v.options || []).map(opt => ({
                        ...opt,
                        id: opt.id || generateId()
                    }))
                }))
            }))
        }))
    }));
};

export const fetchMenu = createAsyncThunk(
    "menu/fetchMenu",
    async ({ resId, platform }, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(
                `/api/menu/${resId}?platform=${platform}`
            );

            const menuData = data?.data?.menu || [];
            const categoriesData = menuData?.categories || (Array.isArray(menuData) ? menuData : []);
            return {
                menu: ensureIds(categoriesData),
                restaurantName: data?.data?.name || ""
            };
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch menu"
            );
        }
    }
);

export const saveMenu = createAsyncThunk(
    "menu/saveMenu",
    async ({ resId, platform, payload }, { rejectWithValue }) => {
        try {
            const { data } = await axios.post(
                `/api/menu/${resId}/${platform}/queue-changes`,
                payload
            );

            return data?.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message ||
                error.message ||
                "Failed to save menu"
            );
        }
    }
);

const createEmptyUpdatedMenu = () => ({
    categories: [],
    sub_categories: [],
    items: [],
});

const isItemValid = (item) => {
    return Boolean(
        item.name?.trim() && 
        item.price !== undefined && item.price !== null && item.price !== "" && 
        item.description?.trim() && 
        item.is_veg && item.is_veg !== "UNKNOWN"
    );
};

const upsertUpdatedMenuEntry = (entries, entry) => {
    if (!Array.isArray(entries)) return;

    // Validation for items (which have price or description properties)
    if ('price' in entry || 'description' in entry || 'is_veg' in entry) {
        // If it's a delete action, we should always allow it
        if (entry.action !== 'delete' && !isItemValid(entry)) {
            // Remove from queue if it becomes invalid
            const idx = entries.findIndex(i => i.id === entry.id);
            if (idx >= 0) entries.splice(idx, 1);
            return;
        }
    }

    const entryWithStatus = { ...entry, status: "pending" };
    const existingIndex = entries.findIndex((item) => item.id === entry.id);

    if (existingIndex >= 0) {
        entries[existingIndex] = {
            ...entries[existingIndex],
            ...entryWithStatus,
        };
        return;
    }

    entries.push(entryWithStatus);
};

const initialState = {
    menu: [],
    restaurantName: "",
    updated_menu: createEmptyUpdatedMenu(),
    loading: false,
    error: null,
    activeCategory: null,
    activeSubCategory: null,
    activeImageSearchItem: null,
    isImageSidebarOpen: false,
};

const menuSlice = createSlice({
    name: "menu",
    initialState,
    reducers: {
        clearMenu: (state) => {
            state.menu = [];
            state.restaurantName = "";
            state.updated_menu = createEmptyUpdatedMenu();
            state.error = null;
            state.activeCategory = null;
            state.activeSubCategory = null;
        },
        setActiveCategory: (state, action) => {
            state.activeCategory = action.payload;
            state.activeSubCategory = null;
        },
        setActiveSubCategory: (state, action) => {
            state.activeSubCategory = action.payload;
        },
        openImageSidebar: (state, action) => {
            state.activeImageSearchItem = action.payload;
            state.isImageSidebarOpen = true;
        },
        closeImageSidebar: (state) => {
            state.activeImageSearchItem = null;
            state.isImageSidebarOpen = false;
        },

        addCategory: (state, action) => {
            const newCategory = {
                id: generateId(),
                name: action.payload.name || "New Category",
                sub_category: [],
            };

            state.menu.push(newCategory);
            upsertUpdatedMenuEntry(state.updated_menu.categories, {
                id: newCategory.id,
                name: newCategory.name,
                action: "create"
            });
        },
        updateCategory: (state, action) => {
            const { categoryId, updates } = action.payload;
            const category = state.menu.find(c => c.id === categoryId);

            if (category) {
                Object.assign(category, updates);

                const existingEntry = state.updated_menu.categories.find((entry) => entry.id === categoryId);
                upsertUpdatedMenuEntry(state.updated_menu.categories, {
                    id: categoryId,
                    ...updates,
                    action: existingEntry?.action || "update",
                });
            }
        },
        deleteCategory: (state, action) => {
            state.menu = state.menu.filter(c => c.id !== action.payload);

            const existingEntry = state.updated_menu.categories.find(entry => entry.id === action.payload);
            if (existingEntry?.action === "create") {
                state.updated_menu.categories = state.updated_menu.categories.filter((entry) => entry.id !== action.payload);
            } else {
                upsertUpdatedMenuEntry(state.updated_menu.categories, { id: action.payload, action: "delete" });
            }
            if (state.activeCategory === action.payload) {
                state.activeCategory = null;
                state.activeSubCategory = null;
            }
        },

        addSubCategory: (state, action) => {
            const { categoryId, name } = action.payload;
            const category = state.menu.find(c => c.id === categoryId);
            if (category) {
                if (!category.sub_category) category.sub_category = [];

                const newSubCategory = {
                    id: generateId(),
                    name: name || "New Subcategory",
                    items: [],
                };

                category.sub_category.push(newSubCategory);
                upsertUpdatedMenuEntry(state.updated_menu.sub_categories, {
                    id: newSubCategory.id,
                    categoryId,
                    name: newSubCategory.name,
                    action: "create"
                });
            }
        },
        updateSubCategory: (state, action) => {
            const { subCategoryId, updates } = action.payload;
            state.menu.forEach(c => {
                const sub = c.sub_category?.find(s => s.id === subCategoryId);
                if (sub) {
                    Object.assign(sub, updates);

                    const existingEntry = state.updated_menu.sub_categories.find((entry) => entry.id === subCategoryId);
                    upsertUpdatedMenuEntry(state.updated_menu.sub_categories, {
                        id: subCategoryId,
                        categoryId: c.id,
                        ...updates,
                        action: existingEntry?.action || "update",
                    });
                }
            });
        },
        deleteSubCategory: (state, action) => {
            let categoryId = null;
            state.menu.forEach(c => {
                if (c.sub_category?.find(s => s.id === action.payload)) {
                    categoryId = c.id;
                    c.sub_category = c.sub_category.filter(s => s.id !== action.payload);
                }
            });
            const existingEntry = state.updated_menu.sub_categories.find(entry => entry.id === action.payload);
            if (existingEntry?.action === "create") {
                state.updated_menu.sub_categories = state.updated_menu.sub_categories.filter((entry) => entry.id !== action.payload);
            } else if (categoryId) {
                upsertUpdatedMenuEntry(state.updated_menu.sub_categories, { id: action.payload, categoryId, action: "delete" });
            }
            if (state.activeSubCategory === action.payload) {
                state.activeSubCategory = null;
            }
        },

        addItem: (state, action) => {
            const { subCategoryId, item } = action.payload;
            state.menu.forEach(c => {
                const sub = c.sub_category?.find(s => s.id === subCategoryId);
                if (sub) {
                    if (!sub.items) sub.items = [];

                    const newItem = {
                        id: generateId(),
                        name: "New Item",
                        description: "",
                        price: 0,
                        is_veg: "UNKNOWN",
                        variants: [],
                        ...item,
                    };

                    sub.items.push(newItem);
                    upsertUpdatedMenuEntry(state.updated_menu.items, {
                        id: newItem.id,
                        categoryId: c.id,
                        categoryName: c.name,
                        subCategoryId,
                        subCategoryName: sub.name,
                        ...newItem,
                        action: "create",
                    });
                }
            });
        },
        updateItem: (state, action) => {
            const { itemId, updates } = action.payload;
            state.menu.forEach(c => {
                c.sub_category?.forEach(s => {
                    const item = s.items?.find(i => i.id === itemId);
                    if (item) {
                        Object.assign(item, updates);

                        const existingEntry = state.updated_menu.items.find((entry) => entry.id === itemId);
                        upsertUpdatedMenuEntry(state.updated_menu.items, {
                            id: itemId,
                            categoryId: c.id,
                            categoryName: c.name,
                            subCategoryId: s.id,
                            subCategoryName: s.name,
                            ...updates,
                            action: existingEntry?.action || "update",
                        });
                    }
                });
            });
        },
        deleteItem: (state, action) => {
            let categoryId = null;
            let categoryName = null;
            let subCategoryId = null;
            let subCategoryName = null;
            state.menu.forEach(c => {
                c.sub_category?.forEach(s => {
                    if (s.items?.find(i => i.id === action.payload)) {
                        categoryId = c.id;
                        categoryName = c.name;
                        subCategoryId = s.id;
                        subCategoryName = s.name;
                        s.items = s.items.filter(i => i.id !== action.payload);
                    }
                });
            });
            const existingEntry = state.updated_menu.items.find(entry => entry.id === action.payload);
            if (existingEntry?.action === "create") {
                state.updated_menu.items = state.updated_menu.items.filter((entry) => entry.id !== action.payload);
            } else if (categoryId && subCategoryId) {
                upsertUpdatedMenuEntry(state.updated_menu.items, {
                    id: action.payload,
                    categoryId,
                    categoryName,
                    subCategoryId,
                    subCategoryName,
                    action: "delete"
                });
            }
        },
        addImage: (state, action) => {
            const { itemId, media } = action.payload;
            state.menu.forEach(c => {
                c.sub_category?.forEach(s => {
                    const item = s.items?.find(i => i.id === itemId);
                    if (item) {
                        const url = typeof media === 'string' ? media : (media?.url || media?.utl);
                        const imageId = media?.imageId || media?.id || null;

                        item.image = { url, imageId };
                        item.image_url = url;
                        item.image_id = imageId;

                        const existingEntry = state.updated_menu.items.find((entry) => entry.id === itemId);
                        upsertUpdatedMenuEntry(state.updated_menu.items, {
                            id: itemId,
                            categoryId: c.id,
                            categoryName: c.name,
                            subCategoryId: s.id,
                            subCategoryName: s.name,
                            image_url: url,
                            image_id: imageId,
                            action: existingEntry?.action || "update",
                        });
                    }
                });
            });
        },
        markMenuUpdatesDone: (state) => {
            ["categories", "sub_categories", "items"].forEach(key => {
                state.updated_menu[key].forEach(entry => {
                    if (entry.status === "queued" || entry.status === "pending") {
                        entry.status = "done";
                    }
                });
            });
        },
        queueAll: (state) => {
            state.menu.forEach(c => {
                const existingEntry = state.updated_menu.categories.find(entry => entry.id === c.id);
                upsertUpdatedMenuEntry(state.updated_menu.categories, {
                    id: c.id,
                    name: c.name,
                    action: existingEntry?.action || "create"
                });

                c.sub_category?.forEach(s => {
                    const existingSub = state.updated_menu.sub_categories.find(entry => entry.id === s.id);
                    upsertUpdatedMenuEntry(state.updated_menu.sub_categories, {
                        id: s.id,
                        categoryId: c.id,
                        name: s.name,
                        action: existingSub?.action || "create"
                    });

                    s.items?.forEach(i => {
                        const existingItem = state.updated_menu.items.find(entry => entry.id === i.id);
                        upsertUpdatedMenuEntry(state.updated_menu.items, {
                            id: i.id,
                            categoryId: c.id,
                            categoryName: c.name,
                            subCategoryId: s.id,
                            subCategoryName: s.name,
                            ...i,
                            action: existingItem?.action || "create"
                        });
                    });
                });
            });
        },
        queueCategory: (state, action) => {
            const categoryId = action.payload;
            const c = state.menu.find(cat => cat.id === categoryId);
            if (!c) return;

            const existingEntry = state.updated_menu.categories.find(entry => entry.id === c.id);
            upsertUpdatedMenuEntry(state.updated_menu.categories, {
                id: c.id,
                name: c.name,
                action: existingEntry?.action || "create"
            });

            c.sub_category?.forEach(s => {
                const existingSub = state.updated_menu.sub_categories.find(entry => entry.id === s.id);
                upsertUpdatedMenuEntry(state.updated_menu.sub_categories, {
                    id: s.id,
                    categoryId: c.id,
                    name: s.name,
                    action: existingSub?.action || "create"
                });

                s.items?.forEach(i => {
                    const existingItem = state.updated_menu.items.find(entry => entry.id === i.id);
                    upsertUpdatedMenuEntry(state.updated_menu.items, {
                        id: i.id,
                        categoryId: c.id,
                        categoryName: c.name,
                        subCategoryId: s.id,
                        subCategoryName: s.name,
                        ...i,
                        action: existingItem?.action || "create"
                    });
                });
            });
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchMenu.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMenu.fulfilled, (state, action) => {
                state.loading = false;
                state.menu = action.payload.menu;
                state.restaurantName = action.payload.restaurantName;
                state.updated_menu = createEmptyUpdatedMenu();
            })
            .addCase(fetchMenu.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(saveMenu.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveMenu.fulfilled, (state) => {
                state.loading = false;
                state.updated_menu = createEmptyUpdatedMenu();
            })
            .addCase(saveMenu.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const {
    clearMenu,
    setActiveCategory,
    setActiveSubCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    addItem,
    updateItem,
    deleteItem,
    addImage,
    openImageSidebar,
    closeImageSidebar,
    markMenuUpdatesDone,
    queueAll,
    queueCategory
} = menuSlice.actions;

export default menuSlice.reducer;