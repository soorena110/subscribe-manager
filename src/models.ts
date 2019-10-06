export type SubscribedItem = string;
export type SubscribeManagerEventType = 'subscribe' | 'unsubscribe' | 'resubscribe'

export interface SubscribeManagerChangeEventArgs {
    subscribed: SubscribedItem[],
    unsubscribed: SubscribedItem[],
    type: SubscribeManagerEventType,
    trigger: {
        layer: string,
        action: SubscribeManagerEventType
    }
}

export type SubscribeManagerEventHandlerFunction = (e: SubscribeManagerChangeEventArgs) => void;