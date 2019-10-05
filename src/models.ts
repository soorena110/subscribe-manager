type SubscribedItem = string;

export interface SubscribeManagerChangeEventArgs {
    subscribed: SubscribedItem[],
    unsubscribed: SubscribedItem[]
}

export type SubscribeManagerEventHandlerFunction = (e: SubscribeManagerChangeEventArgs) => void;