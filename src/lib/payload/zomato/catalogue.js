import { generateTempReferenceId } from "./helper";


export function buildCatalogueUpdatePayload(
    catalogueWrapper,
    updated_data_in_catalogue = {}
) {
    if (!catalogueWrapper?.catalogue) {
        return catalogueWrapper;
    }

    const catalogueId = String(
        catalogueWrapper.catalogue.catalogueId
    );

    if (
        String(updated_data_in_catalogue.catalogueId) !==
        catalogueId
    ) {
        return catalogueWrapper;
    }

    return {
        ...catalogueWrapper,

        catalogue: {
            ...catalogueWrapper.catalogue,

            ...Object.fromEntries(
                Object.entries(updated_data_in_catalogue).filter(
                    ([key]) => key !== "catalogueId"
                )
            ),
        },
    };
}

export function buildNewCataloguePayload(new_catalogue) {
    const propertyWrappers = [];
    const variantWrappers = [];

    (new_catalogue.properties || []).forEach(
        (property, propertyIndex) => {
            const propertyId = generateTempReferenceId();

            const propertyValues = property.values.map(
                (value, valueIndex) => ({
                    value: value.label,
                    order: valueIndex + 1,
                    tempReferenceId: generateTempReferenceId(),
                })
            );

            propertyWrappers.push({
                catalogueProperty: {
                    tempReferenceId: propertyId,
                    name: property.name,
                    order: propertyIndex + 1,
                },
                cataloguePropertyValues: propertyValues,
            });

            propertyValues.forEach((propertyValue, index) => {
                variantWrappers.push({
                    variant: {
                        tempReferenceId: generateTempReferenceId(),
                    },

                    variantModifierGroupMaps: [],

                    variantPropertyValues: [
                        {
                            tempReferenceId:
                                propertyValue.tempReferenceId,
                        },
                    ],

                    variantPrices: [
                        {
                            isVisible: true,
                            service: "delivery",
                            tempReferenceId:
                                generateTempReferenceId(),
                            price:
                                property.values[index].price ?? 0,
                        },
                    ],
                });
            });
        }
    );

    return {
        catalogue: {
            tempReferenceId: generateTempReferenceId(),
            resId: new_catalogue.resId,
            name: new_catalogue.name,
            hasProperties:
                propertyWrappers.length > 0,
            isVisible: true,
            media: new_catalogue.media || [],
            description:
                new_catalogue.description || "",
            isRefrigerationRequired: false,
        },

        catalogueTags: new_catalogue.tags || [],
        cataloguePropertyWrappers: propertyWrappers,
        variantWrappers,
    };
}

export function buildCategoryUpdatePayload(subCategory, category) {

}

export function getUpdatedCatalogueData(catalogueWrappers, updated_catalogue) {
    return catalogueWrappers.map(
        (catalogueWrapper) => {
            const catalogueId = String(
                catalogueWrapper.catalogue?.catalogueId
            );

            if (Array.isArray(updated_catalogue)) {
                const updated_data_in_catalogue = updated_catalogue.find(
                    (item) => String(item.catalogueId) === catalogueId
                );
                if (updated_data_in_catalogue) {
                    const updated_wrapper = buildCatalogueUpdatePayload(catalogueWrapper, updated_data_in_catalogue);
                    console.log("updated_wrapper", updated_wrapper)
                    return updated_wrapper
                }
            }

            return catalogueWrapper;
        }
    );
}