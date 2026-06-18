export const API_ENDPOINTS = {
    MENU: {
        IMAGE_UPLOAD: (resId) =>
            `/api/menu/${resId}/zomato/upload-image`,
        SWIGGY_IMAGE_UPLOAD: (resId) => 
            `/api/menu/${resId}/swiggy/items/image`,
    },
};