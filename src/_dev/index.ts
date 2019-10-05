import {SubscribeManager} from "..";

const subscriber = new SubscribeManager();
subscriber.addEventListener('default', e => console.log(e));


(window as any).subscriber = subscriber;