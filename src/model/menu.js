import mongoose from "mongoose";

const VariantSchema = new mongoose.Schema(
    {
        variantId: String,
        name: String,
        price: Number,

        isDefault: {
            type: Boolean,
            default: false
        },

        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    { _id: false }
);

const AddonSchema = new mongoose.Schema(
    {
        addonId: String,
        name: String,
        price: Number
    },
    { _id: false }
);

const AddonGroupSchema = new mongoose.Schema(
    {
        groupId: String,
        name: String,

        minSelection: {
            type: Number,
            default: 0
        },

        maxSelection: {
            type: Number,
            default: 1
        },

        addons: [AddonSchema]
    },
    { _id: false }
);

const MenuItemSchema = new mongoose.Schema(
    {
        catalogueId: String,
        resId : {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },

        description: String,
        image: String,
        isVeg: {
            type: Boolean,
            default: true
        },

        isAvailable: {
            type: Boolean,
            default: true
        },

        isRecommended: {
            type: Boolean,
            default: false
        },

        variants: [VariantSchema],

        addonGroups: [AddonGroupSchema],

        tags: [String]
    },
    { _id: false }
);

const SubCategorySchema = new mongoose.Schema(
    {
        subCategoryId: String,
        name: String,

        order: {
            type: Number,
            default: 0
        },

        isVisible: {
            type: Boolean,
            default: true
        }
    },
    { _id: false }
);

const SubCategoryWrapperSchema = new mongoose.Schema(
    {
        subCategory: SubCategorySchema,
        subCategoryEntities: [MenuItemSchema]
    },
    { _id: false }
);

const CategorySchema = new mongoose.Schema(
    {
        categoryId: String,
        name: String,

        order: {
            type: Number,
            default: 0
        },

        isVisible: {
            type: Boolean,
            default: true
        }
    },
    { _id: false }
);

const CategoryWrapperSchema = new mongoose.Schema(
    {
        category: CategorySchema,
        subCategoryWrappers: [SubCategoryWrapperSchema]
    },
    { _id: false }
);

const RestaurantMenuSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: String,
            required: true
        },

        name: {
            type: String,
            required: true
        },

        categories: [CategoryWrapperSchema]
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    "RestaurantMenu",
    RestaurantMenuSchema
);