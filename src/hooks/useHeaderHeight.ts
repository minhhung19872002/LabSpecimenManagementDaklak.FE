import { createContext, useContext } from "react";

export const HeaderHeightContext = createContext(88);

export const useHeaderHeight = () => useContext(HeaderHeightContext);
