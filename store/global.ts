import { makeAutoObservable } from "mobx";

class Global {



  constructor() {
    makeAutoObservable(this, {}, { autoBind: true }); // 使用 autoBind 选项
  }

  
}

export default Global;
