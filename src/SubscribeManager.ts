import {
    SubscribedItem,
    SubscribeManagerChangeEventArgs,
    SubscribeManagerEventHandlerFunction,
    SubscribeManagerEventType
} from "./models";
import {EventManager} from "./EventHandler";

interface SubscribeOptions {
    layer?: string,
    preventTriggerListeners?: boolean
}

export default class SubscribeManager {
    private _subscribedLayers: { [layer: string]: { [entityType: string]: SubscribedItem[] } } = {};
    private _eventHandler = new EventManager();

    private _getCurrentSubscribedToEntityInLayerRef(layer: string, entity: string) {
        if (!this._subscribedLayers[layer])
            this._subscribedLayers[layer] = {};
        if (!this._subscribedLayers[layer][entity])
            this._subscribedLayers[layer][entity] = [];

        return this._subscribedLayers[layer][entity];
    }

    private _checkIdExistsInOtherLayers(id: string, exceptLayer: string, entity: string) {
        let shouldBeSubscribed = true;
        Object.keys(this._subscribedLayers).forEach(layerName => {
            if (layerName != exceptLayer)
                if (this._subscribedLayers[layerName][entity] && this._subscribedLayers[layerName][entity].indexOf(id) != -1)
                    shouldBeSubscribed = false;
        });
        return shouldBeSubscribed;
    }

    subscribe(entity: string, subscribingIds: SubscribedItem | SubscribedItem[], e: SubscribeOptions = {}, isBasedOnResubscribe = false) {
        if (!Array.isArray(subscribingIds))
            subscribingIds = [subscribingIds];

        const layer = e.layer || 'default';
        const subs = this._getCurrentSubscribedToEntityInLayerRef(layer, entity);

        const newIds = subscribingIds.filter(id => subs.indexOf(id) == -1);
        newIds.forEach(id => subs.push(id));

        const addingIdsNotExistingInOtherComponents = newIds.filter(id => this._checkIdExistsInOtherLayers(id, layer, entity));

        if (!e.preventTriggerListeners)
            this.raiseEvents({
                subscribed: addingIdsNotExistingInOtherComponents,
                unsubscribed: [],
                type: 'subscribe',
                trigger: {
                    layer: layer,
                    action: isBasedOnResubscribe ? 'resubscribe' : 'subscribe'
                }
            });
        return {addingIdsNotExistingInOtherComponents};
    }

    unsubscribe(entity: string, unsubscribingIds: SubscribedItem[], e: SubscribeOptions = {}, isBasedOnResubscribe = false) {
        if (!Array.isArray(unsubscribingIds))
            unsubscribingIds = [unsubscribingIds];

        const layer = e.layer || 'default';
        const subs = this._getCurrentSubscribedToEntityInLayerRef(layer, entity);

        const removingIds = unsubscribingIds.filter(id => subs.indexOf(id) != -1);
        removingIds.forEach(id => subs.splice(subs.indexOf(id), 1));

        const removingIdsNotExistingInOtherComponents = removingIds.filter(id => this._checkIdExistsInOtherLayers(id, layer, entity));

        if (!e.preventTriggerListeners)
            this.raiseEvents({
                subscribed: [],
                unsubscribed: removingIdsNotExistingInOtherComponents,
                type: 'unsubscribe',
                trigger: {
                    layer: layer,
                    action: isBasedOnResubscribe ? 'resubscribe' : 'unsubscribe'
                }
            });
        return {removingIdsNotExistingInOtherComponents};
    }

    resubscribe(entity: string, resubscribingIds: SubscribedItem[], e: SubscribeOptions = {}) {
        if (!Array.isArray(resubscribingIds))
            resubscribingIds = [resubscribingIds];

        const layer = e.layer || 'default';
        const lastSubscribedIsins = this._getCurrentSubscribedToEntityInLayerRef(layer, entity);
        const newSubscribingIsins = resubscribingIds.filter(id => lastSubscribedIsins.indexOf(id) == -1);
        const removingSubscribingIsins = lastSubscribedIsins.filter(id => resubscribingIds.indexOf(id) == -1);

        const {removingIdsNotExistingInOtherComponents} = this.unsubscribe(entity, removingSubscribingIsins,
            {...e, preventTriggerListeners: false}, true);
        const {addingIdsNotExistingInOtherComponents} = this.subscribe(entity, newSubscribingIsins,
            {...e, preventTriggerListeners: false}, true);

        if (!e.preventTriggerListeners)
            this.raiseEvents({
                subscribed: addingIdsNotExistingInOtherComponents,
                unsubscribed: removingIdsNotExistingInOtherComponents,
                type: 'resubscribe',
                trigger: {
                    layer: layer,
                    action: 'resubscribe'
                }
            });
        return {addingIdsNotExistingInOtherComponents, removingIdsNotExistingInOtherComponents}
    }

    getSubscribedLayers = () => this._subscribedLayers;

    getAllSubscribeds() {
        const subscribeds = {} as { [entity: string]: string[] };
        const subscribedLayers = this._subscribedLayers;

        Object.keys(subscribedLayers).forEach(layerName =>
            Object.keys(subscribedLayers[layerName]).forEach(entityName => {
                if (!subscribeds[entityName])
                    subscribeds[entityName] = [];

                subscribedLayers[layerName][entityName].forEach(id => {
                    if (subscribeds[entityName].indexOf(id))
                        subscribeds[entityName].push(id)
                })
            })
        );

        return Object.keys(subscribeds).map(entity => ({entity, ids: subscribeds[entity]}));
    }

    addEventListener = (eventType: SubscribeManagerEventType, handler: SubscribeManagerEventHandlerFunction) =>
        this._eventHandler.addEventListener(eventType, handler);

    removeEventListener = (eventType: SubscribeManagerEventType, handler: SubscribeManagerEventHandlerFunction) =>
        this._eventHandler.removeEventListener(eventType, handler);

    removeAllListener = (eventType: SubscribeManagerEventType) => this._eventHandler.removeAllEventListeners(eventType);

    raiseEvents = (e: SubscribeManagerChangeEventArgs) => this._eventHandler.trigger(e.type, e);
}