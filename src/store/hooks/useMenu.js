import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMenu, addCategory, addSubCategory, updateCategory, updateSubCategory, deleteCategory, deleteSubCategory, setActiveCategory, setActiveSubCategory, updateCatalogue, saveMenu, addImage } from "@/store/slices/menuSlice";

export const useMenu = (resId) => {
    const dispatch = useDispatch();
    const { menu, loading, error, activeCategory, activeSubCategory } = useSelector((state) => state.menu);

    const getMenu = useCallback(() => {
        if (!resId) return;

        dispatch(fetchMenu(resId));
    }, [dispatch, resId]);

    const updateMenu = useCallback((menu) => {
        if (!resId) return

        dispatch(saveMenu({
            resId,
            payload: menu
        }));
    }, [dispatch, resId])

    const createCategory = useCallback(
        (name) => {
            dispatch(
                addCategory({
                    resId,
                    name,
                })
            );
        },
        [dispatch, resId]
    );

    const createSubCategory = useCallback(
        (categoryId, name) => {
            dispatch(
                addSubCategory({
                    categoryId,
                    name,
                })
            );
        },
        [dispatch]
    );

    const editCategory = useCallback(
        (categoryId, updates) => {
            dispatch(
                updateCategory({
                    categoryId,
                    updates,
                })
            );
        },
        [dispatch]
    );

    const editSubCategory = useCallback(
        (subCategoryId, updates) => {
            dispatch(
                updateSubCategory({
                    subCategoryId,
                    updates,
                })
            );
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

    const activeCategoryData =
        menu?.categoryWrappers?.find(
            (c) =>
                c.category.categoryId === activeCategory ||
                c.category.tempReferenceId === activeCategory
        ) || null;

    let activeSubCategoryData = null;

    for (const category of menu?.categoryWrappers || []) {
        const found =
            category.subCategoryWrappers?.find(
                (s) =>
                    s.subCategory.subCategoryId ===
                    activeSubCategory ||
                    s.subCategory.tempReferenceId ===
                    activeSubCategory
            );

        if (found) {
            activeSubCategoryData = found;
            break;
        }
    }

    const editSubCatalogue = useCallback(
        ({ catalogueId, updates }) => {
            console.log("catalouge id", catalogueId)
            console.log("updates id", updates)

            dispatch(
                updateCatalogue({
                    catalogueId,
                    updates,
                })
            );
        },
        [dispatch]
    );

    const uploadImage = useCallback(
        ({ catalogueId, media }) => {
            console.log("catalouge id", catalogueId)
            console.log("media id", media)

            dispatch(
                addImage({
                    catalogueId,
                    media,
                })
            );
        },
        [dispatch]
    );

    return {
        menu,
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
        updateCatalogue: editSubCatalogue,
        addImage: uploadImage,
        saveMenu: updateMenu
    };
};