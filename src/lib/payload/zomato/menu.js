import { buildCatalogueUpdatePayload, buildNewCataloguePayload, getUpdatedCatalogueData } from "./catalogue";
import { buildCategoryWrapper, getUpdatedCategoryData } from "./category";

export const buildZomatoMenuPayload = ({
    resId,
    menuVersion,
    menuEntityTaxes = [],
    menuEntityCharges = [],
    categoryWrappers = [],
    catalogueWrappers = [],
    modifierGroupWrappers = [],
    resDisclaimers = [],
    requestedModerationData = {
        variantPrices: [],
    },
    contentCombos = [],
    disclaimers = [],
    onHoldItems = {
        catalogues: {},
    },
    lastOpenedCatalogue = {
        category: {},
        subCategory: {},
        catalogue: {},
    },
    requestMetadata = {},
    updated_catalogue,
    new_catalogue,
    updated_category
}) => {
    return {
        res_id: String(resId),
        update_menu: {
            menuEntityTaxes,
            menuEntityCharges,
            categoryWrappers: getUpdatedCategoryData(categoryWrappers, updated_category),
            // catalogueWrappers: [...getUpdatedCatalogueData(catalogueWrappers, updated_catalogue), ...buildNewCataloguePayload(new_catalogue)],
            catalogueWrappers,
            modifierGroupWrappers,
            resDisclaimers,
            requestedModerationData,
            contentCombos,
            disclaimers,
            resId: String(resId),
            requestMetadata,
        },

        onHoldItems,
        last_opened_catalogue: lastOpenedCatalogue,
        menuVersion,
    };
};