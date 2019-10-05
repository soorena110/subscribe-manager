import {SubscribeManagerChangeEventArgs, SubscribeManagerEventHandlerFunction} from "./models";
import {EventManager} from "./EventHandler";

interface SubscribeOptions {
    layer: string,
    shouldTriggerListeners: boolean
}

export default class SubscribeManager {
    private _subscribedLayers: { [layer: string]: { [entityType: string]: string[] } } = {};
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

    subscribe(entity: string, subscribingIds: string[], {layer = 'default', shouldTriggerListeners = true}: SubscribeOptions) {
        const subs = this._getCurrentSubscribedToEntityInLayerRef(layer, entity);

        const newIds = subscribingIds.filter(id => subs.indexOf(id) == -1);
        newIds.forEach(id => subs.push(id));

        const addingIdsNotExistingInOtherComponents = newIds.filter(id => this._checkIdExistsInOtherLayers(id, layer, entity));

        if (shouldTriggerListeners)
            this.raiseEvents(layer, {
                subscribed: addingIdsNotExistingInOtherComponents,
                unsubscribed: []
            });
        return {addingIdsNotExistingInOtherComponents};
    }

    unsubscribe(entity: string, unsubscribingIds: string[], {layer = 'default', shouldTriggerListeners = true}: SubscribeOptions) {
        const subs = this._getCurrentSubscribedToEntityInLayerRef(layer, entity);

        const removingIds = unsubscribingIds.filter(id => subs.indexOf(id) != -1);
        removingIds.forEach(id => subs.splice(subs.indexOf(id), 1));

        const removingIdsNotExistingInOtherComponents = removingIds.filter(id => this._checkIdExistsInOtherLayers(id, layer, entity))
        if (shouldTriggerListeners)
            this.raiseEvents(layer, {
                subscribed: [],
                unsubscribed: removingIdsNotExistingInOtherComponents
            });
        return {removingIdsNotExistingInOtherComponents};
    }

    resubscribe(entity: string, resubscribingIds: string[], {layer = 'default', shouldTriggerListeners = true}: SubscribeOptions) {
        const lastSubscribedIsins = this._getCurrentSubscribedToEntityInLayerRef(layer, entity);
        const newSubscribingIsins = resubscribingIds.filter(id => lastSubscribedIsins.indexOf(id) == -1);
        const removingSubscribingIsins = lastSubscribedIsins.filter(id => resubscribingIds.indexOf(id) == -1);

        const {removingIdsNotExistingInOtherComponents} = this.unsubscribe(entity, removingSubscribingIsins, {
            layer, shouldTriggerListeners: false
        });
        const {addingIdsNotExistingInOtherComponents} = this.subscribe(entity, newSubscribingIsins, {
            layer, shouldTriggerListeners: false
        });

        if (shouldTriggerListeners)
            this.raiseEvents(layer, {
                subscribed: addingIdsNotExistingInOtherComponents,
                unsubscribed: removingIdsNotExistingInOtherComponents
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

    addEventListener = (layer: string, handler: SubscribeManagerEventHandlerFunction) =>
        this._eventHandler.addEventListener(layer, handler);

    removeEventListener = (layer: string, handler: SubscribeManagerEventHandlerFunction) =>
        this._eventHandler.removeEventListener(layer, handler);

    removeAllListener = (layer: string) =>
        this._eventHandler.removeAllEventListeners(layer);

    raiseEvents(layer = 'default', e: SubscribeManagerChangeEventArgs) {
        this._eventHandler.trigger(layer, e);
    }
}