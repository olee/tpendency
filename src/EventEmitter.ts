export interface EventsMap {
    [event: string]: any;
}

export interface DefaultEvents extends EventsMap {
    [event: string]: (...args: any) => void;
}

export class EventEmitter<Events extends EventsMap = DefaultEvents> {
    /**
     * Event names in keys and arrays with listeners in values.
     *
     * ```js
     * emitter1.events = emitter2.events
     * emitter2.events = { }
     * ```
     */
    public events: Partial<{ [E in keyof Events]: Events[E][] }> = {};

    /**
     * Add a listener for a given event.
     *
     * ```js
     * const unbind = ee.on('tick', (tickType, tickDuration) => {
     *   count += 1
     * })
     *
     * disable () {
     *   unbind()
     * }
     * ```
     *
     * @param event The event name.
     * @param cb The listener function.
     * @returns Unbind listener from event.
     */
    public on<K extends keyof Events>(event: K, cb: Events[K]) {
        this.events[event]?.push(cb) || (this.events[event] = [cb]);
        return () => this.off(event, cb);
    }

    /**
     * Removes a listener for a given event.
     *
     * ```js
     * ee.off('tick', tickHandler)
     * ```
     *
     * @param event The event name.
     * @param cb The listener function.
     */
    public off<K extends keyof Events>(event: K, cb: Events[K]) {
        this.events[event] = this.events[event]?.filter(i => cb !== i);
    }

    /**
     * Calls each of the listeners registered for a given event.
     *
     * ```js
     * ee.emit('tick', tickType, tickDuration)
     * ```
     *
     * @param event The event name.
     * @param args The arguments for listeners.
     */
    public emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
        const callbacks = this.events[event] || [];
        for (let i = 0, length = callbacks.length; i < length; i++) {
            callbacks[i](...args);
        }
    }
}
