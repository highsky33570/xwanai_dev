import { createContext, useContext } from "react";
import Global from "./global";
import SessionStore from "./session";
import UserStore from "./user";

class Store {
  global = new Global();
  session = new SessionStore();
  user = new UserStore();
}

const StoreInstance = new Store(); // 创建单例
const StoreContext = createContext<Store>(StoreInstance);

const useStore = () => {
  const store = useContext(StoreContext);
  return store;
};

export { StoreContext, StoreInstance as Store, useStore };
