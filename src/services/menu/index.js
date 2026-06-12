import axios from "axios";
import { API_ENDPOINTS } from "../api-endpoints";

const api = axios.create({
    baseURL: "/",
});

export const MenuService = {
    imageUpload: (resId, formData) =>
        api.post(API_ENDPOINTS.MENU.IMAGE_UPLOAD(resId), formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        }),
};