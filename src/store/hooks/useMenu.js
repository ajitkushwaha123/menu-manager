import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
    fetchMenu,
    addCategory,
    addSubCategory,
    updateCategory,
    updateSubCategory,
    deleteCategory,
    deleteSubCategory,
    setActiveCategory,
    setActiveSubCategory,
    updateItem,
    saveMenu,
    addImage,
    addItem,
    deleteItem,
    queueAll,
    queueCategory,
    saveMenuToDB
} from "@/store/slices/menuSlice";

export const useMenu = (resId, explicitPlatform) => {
    const dispatch = useDispatch();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const platform = explicitPlatform || searchParams?.get('platform') || (pathname?.includes('/zomato') ? 'zomato' : 'swiggy');

    const { menu, restaurantName, updated_menu, loading, error, activeCategory, activeSubCategory } = useSelector((state) => state.menu);

    const getMenu = useCallback(() => {
        if (!resId) return;
        dispatch(fetchMenu({ resId, platform }));
    }, [dispatch, resId, platform]);

    const updateMenu = useCallback((menuData) => {
        if (!resId) return
        
        const targetResId = menuData.resId || resId;
        const targetPlatform = menuData.platform || platform;
        const payload = menuData.payload || menuData;

        return dispatch(saveMenu({
            resId: targetResId,
            platform: targetPlatform,
            payload
        })).unwrap();
    }, [dispatch, resId, platform])

    const saveToDB = useCallback(async () => {
        if (!resId || !Array.isArray(menu)) return;
        return dispatch(saveMenuToDB({
            resId,
            platform,
            menu: { categories: menu }
        })).unwrap();
    }, [dispatch, resId, platform, menu]);

    const createCategory = useCallback(
        (name) => {
            dispatch(addCategory({ name }));
        },
        [dispatch]
    );

    const createSubCategory = useCallback(
        (categoryId, name) => {
            dispatch(addSubCategory({ categoryId, name }));
        },
        [dispatch]
    );

    const editCategory = useCallback(
        (categoryId, updates) => {
            dispatch(updateCategory({ categoryId, updates }));
        },
        [dispatch]
    );

    const editSubCategory = useCallback(
        (subCategoryId, updates) => {
            dispatch(updateSubCategory({ subCategoryId, updates }));
        },
        [dispatch]
    );

    const removeCategory = useCallback(
        (categoryId) => {
            dispatch(deleteCategory(categoryId));
        },
        [dispatch]
    );

    const removeSubCategory = useCallback(
        (subCategoryId) => {
            dispatch(deleteSubCategory(subCategoryId));
        },
        [dispatch]
    );

    const selectCategory = useCallback(
        (categoryId) => {
            dispatch(setActiveCategory(categoryId));
        },
        [dispatch]
    );

    const selectSubCategory = useCallback(
        (subCategoryId) => {
            dispatch(setActiveSubCategory(subCategoryId));
        },
        [dispatch]
    );

    const activeCategoryData = Array.isArray(menu) ? menu.find((c) => c.id === activeCategory) : null;

    let activeSubCategoryData = null;
    if (Array.isArray(menu)) {
        for (const category of menu) {
            const found = category.sub_category?.find((s) => s.id === activeSubCategory);
            if (found) {
                activeSubCategoryData = found;
                break;
            }
        }
    }

    const editItem = useCallback(
        ({ catalogueId, updates }) => {
            dispatch(updateItem({ itemId: catalogueId, updates }));
        },
        [dispatch]
    );

    const createItem = useCallback(
        ({ subCategoryId, item }) => {
            dispatch(addItem({ subCategoryId, item }));
        },
        [dispatch]
    );

    const removeItem = useCallback(
        ({ itemId }) => {
            dispatch(deleteItem(itemId));
        },
        [dispatch]
    );

    const uploadImage = useCallback(
        ({ catalogueId, media }) => {
            dispatch(addImage({ itemId: catalogueId, media }));
        },
        [dispatch]
    );

    const isItemValid = (item) => {
        return Boolean(
            item.name?.trim() && 
            item.price !== undefined && item.price !== null && item.price !== "" && 
            item.description?.trim() && 
            item.is_veg && item.is_veg !== "UNKNOWN"
        );
    };

    const queueEntireMenu = useCallback(() => {
        if (!Array.isArray(menu)) return;

        // Validate all items
        let allValid = true;
        menu.forEach(c => {
            c.sub_category?.forEach(s => {
                s.items?.forEach(i => {
                    if (!isItemValid(i)) allValid = false;
                });
            });
        });

        if (!allValid) {
            toast.error("Cannot queue! Some items are missing required fields (Name, Price, Description, Veg/Non-Veg). Please fill them in (marked in red).");
            return;
        }

        dispatch(queueAll());
        toast.success("Entire menu added to sync queue!");
    }, [dispatch, menu]);

    const queueSpecificCategory = useCallback((categoryId) => {
        if (!Array.isArray(menu)) return;
        const c = menu.find(cat => cat.id === categoryId);
        if (!c) return;

        // Validate all items in this category
        let allValid = true;
        c.sub_category?.forEach(s => {
            s.items?.forEach(i => {
                if (!isItemValid(i)) allValid = false;
            });
        });

        if (!allValid) {
            toast.error("Cannot queue category! Some items are missing required fields. Please fill them in first.");
            return;
        }

        dispatch(queueCategory(categoryId));
        toast.success("Category added to sync queue!");
    }, [dispatch, menu]);

    return {
        menu,
        restaurantName,
        updated_menu,
        loading,
        error,
        activeCategory,
        activeSubCategory,
        activeCategoryData,
        activeSubCategoryData,

        fetchMenu: getMenu,
        addCategory: createCategory,
        addSubCategory: createSubCategory,
        updateCategory: editCategory,
        updateSubCategory: editSubCategory,
        deleteCategory: removeCategory,
        deleteSubCategory: removeSubCategory,
        setActiveCategory: selectCategory,
        setActiveSubCategory: selectSubCategory,

        updateCatalogue: editItem,
        addItem: createItem,
        deleteItem: removeItem,

        addImage: uploadImage,
        saveMenu: updateMenu,
        saveToDB,
        
        queueAll: queueEntireMenu,
        queueCategory: queueSpecificCategory
    };
};