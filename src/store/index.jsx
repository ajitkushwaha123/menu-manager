import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "./slices/projectSlice";
import menuReducer from "./slices/menuSlice"
import notificationReducer from "./slices/notificationSlice";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    notification: notificationReducer,
    menu: menuReducer
  },
});
