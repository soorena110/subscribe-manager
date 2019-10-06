import {SubscribeManager} from "..";

const subscriber = new SubscribeManager();
subscriber.addEventListener('subscribe', e => console.log('subscribe',e));
subscriber.addEventListener('unsubscribe', e => console.log('unsubscribe',e));
subscriber.addEventListener('resubscribe', e => console.log('resubscribe',e));


(window as any).subscriber = subscriber;