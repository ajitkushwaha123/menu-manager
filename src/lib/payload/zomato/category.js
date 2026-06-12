export function buildCategoryPayload(
    categoryWrapper,
    updatedData = {}
) {
    const updatedSubCategories =
        updatedData?.subCategoryWrappers || [];

    return {
        category: {
            ...categoryWrapper.category,
            tempReferenceId: "",
            hasTiming: false,
            ...(updatedData.category || {}),
        },

        timings: categoryWrapper.timings || [],
        timingsV2: categoryWrapper.timingsV2 || [],

        subCategoryWrappers: (
            categoryWrapper.subCategoryWrappers || []
        ).map((wrapper) => {
            const subCategoryId = String(
                wrapper?.subCategory?.subCategoryId
            );

            const matchedSubCategory =
                updatedSubCategories.find(
                    (item) =>
                        String(
                            item?.subCategory?.subCategoryId
                        ) === subCategoryId
                );

            return {
                subCategory: {
                    ...wrapper.subCategory,
                    tempReferenceId: "",
                    ...(matchedSubCategory?.subCategory || {}),
                },

                subCategoryEntities:
                    wrapper?.subCategoryEntities || [],
            };
        }),

        categoryServices:
            categoryWrapper.categoryServices || [],
    };
}

export function getUpdatedCategoryData(
    categoryWrappers,
    updated_category = []
) {
    return categoryWrappers.map((categoryWrapper) => {
        const categoryId = String(
            categoryWrapper?.category?.categoryId
        );

        const updatedData = updated_category.find(
            (item) =>
                String(
                    item?.category?.categoryId
                ) === categoryId
        );

        return buildCategoryPayload(
            categoryWrapper,
            updatedData || {}
        );
    });
}