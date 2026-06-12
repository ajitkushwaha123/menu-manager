import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMenu = createAsyncThunk(
    "menu/fetchMenu",
    async (resId, { rejectWithValue }) => {
        try {
            const { data } = await axios.get(
                `/api/menu/${resId}/zomato/get-menu`
            );
            return data?.data;
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
    async ({ resId, payload }, { rejectWithValue }) => {
        try {
            const { data } = await axios.post(
                `/api/menu/${resId}/zomato/update-menu`,
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

const initialState = {
    menu: null,
    loading: false,
    error: null,
    activeCategory: null,
    activeSubCategory: null,
};

const menuSlice = createSlice({
    name: "menu",
    initialState,
    reducers: {
        clearMenu: (state) => {
            state.menu = null;
            state.error = null;
            state.activeCategory = null;
            state.activeSubCategory = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchMenu.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMenu.fulfilled, (state, action) => {
                state.loading = false;
                state.menu = action.payload;
                state.activeCategory = null;
                state.activeSubCategory = null;
            })
            .addCase(fetchMenu.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(saveMenu.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveMenu.fulfilled, (state, action) => {
                state.loading = false;
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
    setActiveSubCategory
} = menuSlice.actions;

export default menuSlice.reducer;