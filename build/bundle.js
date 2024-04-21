
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert$1(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        const options = { direction: 'in' };
        let config = fn(node, params, options);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config(options);
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        const options = { direction: 'out' };
        let config = fn(node, params, options);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config(options);
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        const options = { direction: 'both' };
        let config = fn(node, params, options);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config(options);
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert$1(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    const defaultOptions = {
        setEventListeners: true,
    };
    const cameraEvent = new Event('camera');
    class Camera {
        constructor(canvas, options = defaultOptions) {
            this.options = defaultOptions;
            this.canvas = canvas;
            this.options = options;
            this.reset();
            if (options.setEventListeners) {
                this.canvas.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    this.scaleAt(e.offsetX, e.offsetY, Math.pow(1.001, e.deltaY));
                });
                this.canvas.addEventListener('mousemove', (e) => {
                    if (e.buttons == 1)
                        this.move(e.movementX, e.movementY);
                });
            }
        }
        w() { return this.canvas.width; }
        h() { return this.canvas.height; }
        aspect() { return this.w() / this.h(); }
        reset() {
            this.origin = { x: 0, y: 0 };
            this.scale = { x: this.aspect(), y: 1 };
            this.canvas.dispatchEvent(cameraEvent);
        }
        screenToWorld(x, y) {
            return {
                x: this.origin.x + this.scale.x * (2 * x / this.canvas.width - 1),
                y: this.origin.y + this.scale.y * (-2 * y / this.canvas.height + 1),
            };
        }
        worldToScreen(x, y) {
            return {
                x: this.canvas.width / 2 * (1 + (x - this.origin.x) / this.scale.x),
                y: this.canvas.height / 2 * (1 - (y - this.origin.y) / this.scale.y),
            };
        }
        scaleAt(x, y, scaleBy) {
            const w = this.screenToWorld(x, y);
            const a = 1 - scaleBy;
            this.origin.x += a * (w.x - this.origin.x);
            this.origin.y += a * (w.y - this.origin.y);
            this.scale.x *= scaleBy;
            this.scale.y *= scaleBy;
            this.canvas.dispatchEvent(cameraEvent);
        }
        move(x, y) {
            this.origin.x -= ((x / this.w()) * this.scale.x) * 2.0;
            this.origin.y += ((y / this.h()) * this.scale.y) * 2.0;
            this.canvas.dispatchEvent(cameraEvent);
        }
        getWorldMatrix() {
            return [
                this.scale.x, 0, 0,
                0, this.scale.y, 0,
                this.origin.x, this.origin.y, 1,
            ];
        }
    }

    class glslShaderError extends Error {
        constructor(message, shaderType, fileName) {
            super(message);
            this.name = "ShaderError";
            this.shaderType = shaderType;
            this.fileName = fileName;
        }
        toString() {
            return `GLSL ERROR: ${this.message}`;
        }
    }
    // https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
    function resizeCanvasToDisplaySize(canvas) {
        // Lookup the size the browser is displaying the canvas in CSS pixels.
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        // Check if the canvas is not the same size.
        const needResize = canvas.width !== displayWidth ||
            canvas.height !== displayHeight;
        if (needResize) {
            // Make the canvas the same size
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
        return needResize;
    }
    function bufferFullscreenQuad(gl, attribLocation) {
        let buffer = gl.createBuffer();
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        gl.enableVertexAttribArray(attribLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        let data = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.vertexAttribPointer(attribLocation, 2, gl.FLOAT, false, 0, 0);
    }
    function getShaderText(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield fetch(url);
            let text = yield response.text();
            return text;
        });
    }

    class Uniform {
        constructor(name, type, value = null, location = null) {
            this.name = name;
            this.type = type;
            this.value = value;
            this.loc = location;
        }
    }
    // looks for #include directives and replaces them with content from file  
    function insertIncludes(src) {
        return __awaiter(this, void 0, void 0, function* () {
            let lines = src.split("\n");
            let output = "";
            for (let line of lines) {
                output += line + "\n";
                if (line.trim().startsWith("//#include")) {
                    let filename = line.split(" ")[1];
                    let includedSrc = yield getShaderText(`shaders/${filename}`);
                    output += includedSrc + "\n";
                }
            }
            return output;
        });
    }
    function insert(src, keyword, replacement) {
        let re = new RegExp(`//#${keyword}`);
        return src.replace(re, `//#${keyword}\n${replacement}`);
    }
    function insertUserFunction(src, userFunction) {
        return insert(src, "UFUNC", userFunction);
    }
    function insertUniforms(src, uniforms) {
        let uniformsStr = "";
        for (let u of uniforms) {
            uniformsStr += `uniform ${u.type} ${u.name};\n`;
        }
        return insert(src, "UNIFORMS", uniformsStr);
    }
    class ProgramManager {
        constructor(gl, uniforms) {
            this.gl = gl;
            this.id = gl.createProgram();
            this.uniforms = new Map();
            this.addUniforms(uniforms);
        }
        compileShader(type, source, url) {
            const gl = this.gl;
            let shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                let error = gl.getShaderInfoLog(shader);
                gl.deleteShader(shader);
                this.isCompiled = false;
                throw new glslShaderError(error, type, url);
            }
            return shader;
        }
        compileFromUrls(vertUrl, fragUrl, userFunction) {
            return __awaiter(this, void 0, void 0, function* () {
                this.vertUrl = vertUrl;
                this.fragUrl = fragUrl;
                let vertSrc = yield getShaderText(vertUrl);
                let fragSrc = yield getShaderText(fragUrl);
                fragSrc = yield insertIncludes(fragSrc);
                this.vertSrcRaw = vertSrc;
                this.fragSrcRaw = fragSrc;
                return this.compile(vertSrc, fragSrc, userFunction);
            });
        }
        compile(vertSrc, fragSrc, userFunction) {
            const gl = this.gl;
            fragSrc = insertUserFunction(fragSrc, userFunction);
            fragSrc = insertUniforms(fragSrc, this.uniforms.values());
            // console.log(addLineNums(fragSrc));
            this.isCompiled = true;
            const vertShader = this.compileShader(gl.VERTEX_SHADER, vertSrc, this.vertUrl);
            const fragShader = this.compileShader(gl.FRAGMENT_SHADER, fragSrc, this.fragUrl);
            gl.attachShader(this.id, vertShader);
            gl.attachShader(this.id, fragShader);
            gl.linkProgram(this.id);
            if (!gl.getProgramParameter(this.id, gl.LINK_STATUS)) {
                console.error("Error in creating program: ", gl.getProgramInfoLog(this.id));
                gl.deleteProgram(this.id);
                return;
            }
            this.setUniformLocations();
            this.vertShader = vertShader;
            this.fragShader = fragShader;
            return this.id;
        }
        recompile(userFunction) {
            const gl = this.gl;
            if (this.isCompiled) {
                gl.detachShader(this.id, this.vertShader);
                gl.deleteShader(this.vertShader);
                gl.detachShader(this.id, this.fragShader);
                gl.deleteShader(this.fragShader);
            }
            this.compile(this.vertSrcRaw, this.fragSrcRaw, userFunction);
        }
        addUniforms(uniforms) {
            for (let u of uniforms) {
                this.addUniform(u);
            }
        }
        addUniform(u) {
            if (this.uniforms.has(u.name)) {
                console.error(`Uniform ${u.name} already exists in program`);
                return;
            }
            this.uniforms.set(u.name, u);
        }
        deleteUniform(name) {
            this.uniforms.delete(name);
        }
        setUniformValue(name, value) {
            this.uniforms.get(name).value = value;
        }
        getUniformValue(name) {
            return this.uniforms.get(name).value;
        }
        logUniforms() {
            console.table(Array.from(this.uniforms.values()).map(u => [u.name, u.value]));
        }
        setUniformLocations() {
            for (let u of this.uniforms.values()) {
                u.loc = this.gl.getUniformLocation(this.id, u.name);
            }
        }
        bindAllUniforms() {
            const gl = this.gl;
            for (let u of this.uniforms.values()) {
                if (u.type === "float")
                    gl.uniform1f(u.loc, u.value);
                else if (u.type === "vec2")
                    gl.uniform2fv(u.loc, u.value);
                else if (u.type === "int")
                    gl.uniform1i(u.loc, u.value);
                else if (u.type === "mat2")
                    gl.uniformMatrix2fv(u.loc, false, u.value);
                else if (u.type === "mat3")
                    gl.uniformMatrix3fv(u.loc, false, u.value);
                else if (u.type === "bool")
                    gl.uniform1i(u.loc, u.value);
                else
                    console.error("Unsupported uniform type: " + u.type);
            }
        }
    }

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    let getRandomValues;
    const rnds8 = new Uint8Array(16);
    function rng() {
      // lazy load so that environments that need to polyfill have a chance to do so
      if (!getRandomValues) {
        // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
        getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

        if (!getRandomValues) {
          throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
      }

      return getRandomValues(rnds8);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    const byteToHex = [];

    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).slice(1));
    }

    function unsafeStringify(arr, offset = 0) {
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
    }

    const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
    var native = {
      randomUUID
    };

    function v4(options, buf, offset) {
      if (native.randomUUID && !buf && !options) {
        return native.randomUUID();
      }

      options = options || {};
      const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        offset = offset || 0;

        for (let i = 0; i < 16; ++i) {
          buf[offset + i] = rnds[i];
        }

        return buf;
      }

      return unsafeStringify(rnds);
    }

    function makeAbsolute(e) {
        e.target.style.position = "absolute";
        e.target.style.width = "100%";
    }
    function roundToDigits(x, digits) {
        const m = Math.pow(10, digits);
        return Math.round(x * m) / m;
    }
    function rectToPolar(x, y) {
        return { r: Math.sqrt(x * x + y * y), theta: Math.atan2(y, x) };
    }
    function randomColorRGB() {
        return `#${Math.floor(Math.random() * 16777215).toString(16).padEnd(6, '0')}`;
    }
    function cloneMap(m) {
        return new Map(JSON.parse(JSON.stringify(Object.entries(Object.fromEntries(m.entries())))));
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const compilationErrors = writable([]);
    const uvars = writable([
        { id: v4(), type: "float", name: "x", value: 0, min: -10, max: 10, step: 0.01 },
        { id: v4(), type: "vec2", name: "p", x: 0, y: 0, color: randomColorRGB() },
    ]);

    var TT;
    (function (TT) {
        // literals
        TT[TT["IDENTIFIER"] = 0] = "IDENTIFIER";
        TT[TT["LITERAL_REAL"] = 1] = "LITERAL_REAL";
        TT[TT["LITERAL_IMAG"] = 2] = "LITERAL_IMAG";
        TT[TT["TRUE"] = 3] = "TRUE";
        TT[TT["FALSE"] = 4] = "FALSE";
        // one char tokens
        TT[TT["LPAREN"] = 5] = "LPAREN";
        TT[TT["RPAREN"] = 6] = "RPAREN";
        TT[TT["PLUS"] = 7] = "PLUS";
        TT[TT["MINUS"] = 8] = "MINUS";
        TT[TT["STAR"] = 9] = "STAR";
        TT[TT["SLASH"] = 10] = "SLASH";
        TT[TT["COMMA"] = 11] = "COMMA";
        TT[TT["BANG"] = 12] = "BANG";
        TT[TT["EQUAL"] = 13] = "EQUAL";
        TT[TT["LESS"] = 14] = "LESS";
        TT[TT["GREATER"] = 15] = "GREATER";
        TT[TT["HASH"] = 16] = "HASH";
        TT[TT["COLON"] = 17] = "COLON";
        TT[TT["CARET"] = 18] = "CARET";
        TT[TT["SEMICOLON"] = 19] = "SEMICOLON";
        // two-char tokens
        TT[TT["BANG_EQUAL"] = 20] = "BANG_EQUAL";
        TT[TT["EQUAL_EQUAL"] = 21] = "EQUAL_EQUAL";
        TT[TT["COLON_EQUAL"] = 22] = "COLON_EQUAL";
        TT[TT["LESS_EQUAL"] = 23] = "LESS_EQUAL";
        TT[TT["GREATER_EQUAL"] = 24] = "GREATER_EQUAL";
        TT[TT["DOUBLE_BAR"] = 25] = "DOUBLE_BAR";
        TT[TT["DOUBLE_AMPERSAND"] = 26] = "DOUBLE_AMPERSAND";
        TT[TT["ARROW"] = 27] = "ARROW";
        TT[TT["DOUBLE_DOT"] = 28] = "DOUBLE_DOT";
        // keywords
        TT[TT["AND"] = 29] = "AND";
        TT[TT["OR"] = 30] = "OR";
        TT[TT["IF"] = 31] = "IF";
        TT[TT["ELSE"] = 32] = "ELSE";
        TT[TT["ELIF"] = 33] = "ELIF";
        TT[TT["RETURN"] = 34] = "RETURN";
        TT[TT["BREAK"] = 35] = "BREAK";
        TT[TT["FOR"] = 36] = "FOR";
        TT[TT["WHILE"] = 37] = "WHILE";
        // other
        TT[TT["NEWLINE"] = 38] = "NEWLINE";
        TT[TT["INDENT"] = 39] = "INDENT";
        TT[TT["DEDENT"] = 40] = "DEDENT";
        TT[TT["EOF"] = 41] = "EOF";
    })(TT || (TT = {}));
    const lexemeToToken = new Map(Object.entries({
        '(': TT.LPAREN,
        ')': TT.RPAREN,
        '+': TT.PLUS,
        '-': TT.MINUS,
        '*': TT.STAR,
        '/': TT.SLASH,
        '^': TT.CARET,
        ';': TT.SEMICOLON,
        ',': TT.COMMA,
        '!': TT.BANG,
        ':': TT.COLON,
        '=': TT.EQUAL,
        '<': TT.LESS,
        '>': TT.GREATER,
        '#': TT.HASH,
        '&&': TT.DOUBLE_AMPERSAND,
        '||': TT.DOUBLE_BAR,
        '==': TT.EQUAL_EQUAL,
        '!=': TT.BANG_EQUAL,
        '<=': TT.LESS_EQUAL,
        '>=': TT.GREATER_EQUAL,
        ':=': TT.COLON_EQUAL,
        '..': TT.DOUBLE_DOT,
        '->': TT.ARROW,
        'and': TT.AND,
        'or': TT.OR,
        'if': TT.IF,
        'else': TT.ELSE,
        'elif': TT.ELIF,
        'return': TT.RETURN,
        'break': TT.BREAK,
        'for': TT.FOR,
        'while': TT.WHILE,
        'true': TT.TRUE,
        'false': TT.FALSE,
    }));
    class Token {
        constructor(type, lexeme, line, literal = null) {
            this.type = type;
            this.lexeme = lexeme, this.line = line;
            this.literal = literal;
        }
        toString() {
            return { type: TT[this.type], lexeme: this.lexeme, line: this.line, literal: this.literal };
        }
    }

    class CompileError extends Error {
        constructor(message, line = null, lexeme = null) {
            super(message);
            this.message = message;
            this.line = line;
            this.lexeme = lexeme;
            Object.setPrototypeOf(this, CompileError.prototype); // TODO
        }
        toString() {
            return "oije";
        }
    }
    class SyntaxErr extends CompileError {
        constructor(message, line = null, lexeme = null) {
            super(message);
            this.message = message;
            this.line = line;
            this.lexeme = lexeme;
            Object.setPrototypeOf(this, SyntaxErr.prototype); // TODO
        }
        toString() {
            return `SYNTAX ERROR: line ${this.line} at '${this.lexeme}': ${this.message}`;
        }
    }
    class TypeErr extends CompileError {
        constructor(message, line = null, lexeme = null) {
            super(message);
            this.message = message;
            this.line = line;
            this.lexeme = lexeme;
            Object.setPrototypeOf(this, TypeErr.prototype); // TODO
        }
        toString() {
            return `TYPE ERROR: ${this.message}`; // TODO: fix so that we have more info left at typecheck time
        }
    }

    const TABSIZE = 4;
    const EOF$1 = "\0";
    const oneCharLexemes = new Set(['(', ')', '+', '*', '/', ',', '^', ';']); // can only be one char lexeme
    const twoCharLexemes = new Set(['-', ':', '!', '=', '<', '>', '.']); // can be one or two char lexeme
    function isDigit(c) {
        return /[0-9]/.test(c);
    }
    function isIdentifierStart(c) {
        return /[_a-zA-Z]/.test(c);
    }
    function isIdentifierChar(c) {
        return /[_a-zA-Z0-9]/.test(c);
    }
    class Scanner {
        constructor(source) {
            this.cur = 0;
            this.line = 1;
            this.lexemeStart = 0;
            this.tokens = [];
            this.indentLevels = [];
            this.source = source;
            this.indentLevels.push(this.getInitialIndent());
        }
        isAtEnd() {
            return this.cur >= this.source.length;
        }
        peek() {
            if (this.isAtEnd())
                return EOF$1;
            return this.source[this.cur];
        }
        peek2() {
            if (this.cur + 1 >= this.source.length)
                return EOF$1;
            return this.source[this.cur + 1];
        }
        advance() {
            return this.source[this.cur++];
        }
        match(c) {
            if (this.peek() === c) {
                this.cur += 1;
                return true;
            }
            return false;
        }
        currentLexeme() {
            return this.source.substring(this.lexemeStart, this.cur);
        }
        addToken(type, literal = null) {
            this.tokens.push(new Token(type, this.currentLexeme(), this.line, literal));
        }
        scan() {
            while (this.cur < this.source.length) {
                this.lexemeStart = this.cur;
                this.scanToken();
            }
            return this.tokens;
        }
        scanToken() {
            const c = this.advance();
            if (oneCharLexemes.has(c)) {
                this.addToken(lexemeToToken.get(c));
                return;
            }
            if (twoCharLexemes.has(c)) {
                const c2 = this.peek();
                if (lexemeToToken.has(c + c2)) {
                    this.cur += 1;
                    this.addToken(lexemeToToken.get(c + c2));
                    return;
                }
                if (lexemeToToken.has(c)) {
                    this.addToken(lexemeToToken.get(c));
                    return;
                }
            }
            if (c === "#") {
                this.scanComment();
                return;
            }
            if (c === "\n") {
                this.scanNewline();
                return;
            }
            if (c === " " || c === "\r" || c === "\t")
                return;
            if (isDigit(c)) {
                this.scanNumber();
                return;
            }
            if (isIdentifierStart(c)) {
                this.scanIdentifier();
                return;
            }
            throw new SyntaxErr("Unexcpected character: " + c, this.line);
        }
        scanComment() {
            while (this.peek() != "\n" && !this.isAtEnd())
                this.cur += 1;
        }
        getInitialIndent() {
            let level = this.getIndentLevel();
            while (this.match("\n"))
                level = this.getIndentLevel();
            return level;
        }
        getIndentLevel() {
            let level = 0;
            while (!this.isAtEnd()) {
                const c = this.peek();
                if (c === " ")
                    level += 1;
                else if (c === "\t")
                    level += TABSIZE;
                else
                    break;
                this.cur += 1;
            }
            return level;
        }
        scanNewline() {
            this.line += 1;
            const lastIndentLevel = this.indentLevels[this.indentLevels.length - 1];
            const newIndentLevel = this.getIndentLevel();
            if (this.peek() === "#") { // skip lines that are only comments, to avoid adding double newlines
                this.scanComment();
                return;
            }
            if (this.peek() === "\n" || this.peek() === EOF$1)
                return; // skip double newlines and indent before EOF
            this.addToken(TT.NEWLINE);
            if (newIndentLevel > lastIndentLevel) {
                this.addToken(TT.INDENT);
                this.indentLevels.push(newIndentLevel);
            }
            else if (newIndentLevel < lastIndentLevel) {
                while (this.indentLevels.length > 0 && this.indentLevels[this.indentLevels.length - 1] > newIndentLevel) {
                    this.addToken(TT.DEDENT);
                    this.indentLevels.pop();
                }
                if (this.indentLevels[this.indentLevels.length - 1] !== newIndentLevel) {
                    throw new SyntaxErr("Dedent level doesnt match previous indents", this.line);
                }
            }
        }
        consumeDigits() {
            while (isDigit(this.peek()))
                this.cur += 1;
        }
        scanNumber() {
            this.consumeDigits();
            if (this.peek() === "." && this.peek2() !== ".") {
                this.cur += 1;
                this.consumeDigits();
            }
            const num = Number.parseFloat(this.currentLexeme());
            if (this.peek() === "i") {
                this.addToken(TT.LITERAL_IMAG, num);
                this.cur += 1;
            }
            else
                this.addToken(TT.LITERAL_REAL, num);
        }
        scanIdentifier() {
            while (isIdentifierChar(this.peek()))
                this.cur += 1;
            const name = this.currentLexeme();
            if (name === "i")
                this.addToken(TT.LITERAL_IMAG, 1); // imaginary number i
            else if (lexemeToToken.has(name))
                this.addToken(lexemeToToken.get(name)); // keyword
            else
                this.addToken(TT.IDENTIFIER, name);
        }
    }

    var NT;
    (function (NT) {
        // Expressions
        NT[NT["Literal"] = 0] = "Literal";
        NT[NT["Unary"] = 1] = "Unary";
        NT[NT["Binary"] = 2] = "Binary";
        NT[NT["Grouping"] = 3] = "Grouping";
        NT[NT["Variable"] = 4] = "Variable";
        NT[NT["FuncCall"] = 5] = "FuncCall";
        // Statements
        NT[NT["StmtList"] = 6] = "StmtList";
        NT[NT["Declaration"] = 7] = "Declaration";
        NT[NT["Assignment"] = 8] = "Assignment";
        NT[NT["For"] = 9] = "For";
        NT[NT["While"] = 10] = "While";
        NT[NT["If"] = 11] = "If";
        NT[NT["FuncDef"] = 12] = "FuncDef";
        NT[NT["Return"] = 13] = "Return";
        NT[NT["Break"] = 14] = "Break";
    })(NT || (NT = {}));

    var DT;
    (function (DT) {
        DT[DT["Bool"] = 0] = "Bool";
        DT[DT["Real"] = 1] = "Real";
        DT[DT["Imag"] = 2] = "Imag";
    })(DT || (DT = {}));
    const typeToGlslType = new Map([
        [DT.Real, "float"], [DT.Imag, "vec2"], [DT.Bool, "bool"]
    ]);
    const glslTypeToDT = new Map([
        ["float", DT.Real,], ["vec2", DT.Imag,], ["bool", DT.Bool]
    ]);

    const EOF = new Token(TT.EOF, null, -1);
    class Parser {
        constructor(tokens) {
            this.cur = 0;
            this.tokens = tokens;
        }
        // Utility methods
        error(msg) {
            const tok = !this.isAtEnd() ? this.peek() : this.prev();
            throw new SyntaxErr(msg, tok.line, tok.lexeme);
        }
        isAtEnd() {
            return this.cur >= this.tokens.length;
        }
        peek() {
            if (this.isAtEnd())
                return EOF;
            return this.tokens[this.cur];
        }
        prev() {
            return this.tokens[this.cur - 1];
        }
        backup() {
            this.cur -= 1;
        }
        advance() {
            if (this.isAtEnd())
                return EOF;
            return this.tokens[this.cur++];
        }
        match(types, consume = true) {
            const c = this.peek();
            if (types.some(t => c.type === t))
                return (consume ? this.advance() : true);
            return false;
        }
        matchOrError(types, msg) {
            const tok = this.match(types);
            if (tok)
                return tok;
            else
                this.error(msg);
        }
        // Recursive descent methods
        parse() {
            return this.stmtList();
        }
        stmtList() {
            let statements = [];
            while (!this.isAtEnd() && (this.peek().type !== TT.DEDENT)) {
                statements.push(this.statement());
            }
            return { nodeType: NT.StmtList, statements: statements };
        }
        statement() {
            let stmt;
            switch (this.peek().type) {
                case TT.IDENTIFIER:
                    stmt = this.assignmentOrDeclarationOrFuncdef();
                    break;
                case TT.IF:
                    this.advance();
                    stmt = this.ifStmt();
                    break;
                case TT.FOR:
                    this.advance();
                    stmt = this.forStmt();
                    break;
                case TT.WHILE:
                    this.advance();
                    stmt = this.whileStmt();
                    break;
                case TT.RETURN:
                    this.advance();
                    stmt = this.returnStmt();
                    break;
                case TT.BREAK:
                    this.advance();
                    stmt = this.breakStmt();
                    break;
                case TT.INDENT:
                    this.error("Unexpected indent");
                default:
                    this.error("Excpected statement");
            }
            // newline has already been handled in these cases
            if ([NT.If, NT.For, NT.While, NT.FuncDef].includes(stmt.nodeType))
                return stmt;
            this.matchOrError([TT.NEWLINE, TT.SEMICOLON, TT.EOF], "Unexcpected token " + this.peek().lexeme);
            return stmt;
        }
        indentedBlock() {
            this.matchOrError([TT.INDENT], "Excpected indent");
            const block = this.stmtList();
            this.matchOrError([TT.DEDENT, TT.EOF], "Expected dedent");
            return block;
        }
        indentedBlockOrOnelineStmt() {
            if (this.match([TT.NEWLINE]))
                return this.indentedBlock();
            else
                return { nodeType: NT.StmtList, statements: [this.statement()] };
        }
        assignmentOrDeclarationOrFuncdef() {
            const name = this.advance().lexeme;
            if (this.match([TT.LPAREN]))
                return this.functionDefinition(name);
            const op = this.matchOrError([TT.EQUAL, TT.COLON_EQUAL], "Excpected assignment or declaration");
            const value = this.expression();
            if (op.type === TT.EQUAL)
                return { nodeType: NT.Assignment, name: name, value: value };
            else
                return { nodeType: NT.Declaration, name: name, value: value };
        }
        identifier() {
            this.matchOrError([TT.IDENTIFIER], "Expected identifier");
            return this.prev().lexeme;
        }
        parameterList() {
            if (this.match([TT.RPAREN]))
                return [];
            let args = [this.identifier()];
            while (!this.match([TT.RPAREN])) {
                this.matchOrError([TT.COMMA], "Expected ',' or ')' in parameter list");
                args.push(this.identifier());
            }
            return args;
        }
        argumentList() {
            if (this.match([TT.RPAREN]))
                return [];
            let args = [this.expression()];
            while (!this.match([TT.RPAREN])) {
                this.matchOrError([TT.COMMA], "Expected ',' or ')' in argument list");
                args.push(this.expression());
            }
            return args;
        }
        functionDefinition(name) {
            let params = this.parameterList();
            this.matchOrError([TT.COLON_EQUAL], "Expected ':=' in function definition");
            let body;
            if (this.match([TT.NEWLINE])) {
                body = this.indentedBlock();
            }
            else { // f(x) := expr  ->  f(x) := { return expr }
                let stmt = { nodeType: NT.Return, value: this.expression() };
                body = { nodeType: NT.StmtList, statements: [stmt] };
                this.matchOrError([TT.NEWLINE, TT.SEMICOLON, TT.EOF], "Unexcpected token " + this.peek().lexeme);
            }
            return { nodeType: NT.FuncDef, name, params, body };
        }
        ifStmt() {
            const condition = this.expression();
            this.matchOrError([TT.COLON], "Excpected ':' in if-statement");
            const mainBranch = this.indentedBlockOrOnelineStmt();
            let elseBranch;
            if (this.match([TT.ELIF])) {
                elseBranch = { nodeType: NT.StmtList, statements: [this.ifStmt()] };
            }
            else if (this.match([TT.ELSE])) {
                this.matchOrError([TT.COLON], "Expected ':' after else");
                elseBranch = this.indentedBlockOrOnelineStmt();
            }
            return { nodeType: NT.If, condition, mainBranch, elseBranch };
        }
        whileStmt() {
            const condition = this.expression();
            this.matchOrError([TT.COLON], "Excpected ':' in while-statement");
            const body = this.indentedBlockOrOnelineStmt();
            return { nodeType: NT.While, condition, body };
        }
        forStmt() {
            const loopvar = this.matchOrError([TT.IDENTIFIER], "Expected identifier in for-statement").literal;
            this.matchOrError([TT.EQUAL], "Expected '=' in for-statement");
            const start = this.expression();
            this.matchOrError([TT.DOUBLE_DOT], "Expected range (start..end..[step])");
            const end = this.expression();
            let step = { nodeType: NT.Literal, value: 1, dataType: DT.Real };
            if (this.match([TT.DOUBLE_DOT])) {
                step = this.expression();
            }
            this.matchOrError([TT.COLON], "Excpected ':' in for-statement");
            const body = this.indentedBlockOrOnelineStmt();
            return { nodeType: NT.For, loopvar, start, end, step, body };
        }
        returnStmt() {
            const value = this.expression();
            return { nodeType: NT.Return, value };
        }
        breakStmt() {
            return { nodeType: NT.Break };
        }
        expression() {
            return this.logical();
        }
        _binary(opTokens, nextFn) {
            let left = nextFn();
            while (this.match(opTokens)) {
                const op = this.prev();
                const right = nextFn();
                left = { nodeType: NT.Binary, left, op, right };
            }
            return left;
        }
        logical() {
            return this._binary([TT.AND, TT.OR], () => this.equality());
        }
        equality() {
            return this._binary([TT.EQUAL_EQUAL, TT.BANG_EQUAL], () => this.comparision());
        }
        comparision() {
            return this._binary([TT.LESS, TT.LESS_EQUAL, TT.GREATER, TT.GREATER_EQUAL], () => this.term());
        }
        term() {
            return this._binary([TT.PLUS, TT.MINUS], () => this.factor());
        }
        factor() {
            return this._binary([TT.STAR, TT.SLASH], () => this.unary());
        }
        unary() {
            if (this.match([TT.MINUS, TT.BANG])) {
                const op = this.prev();
                const expr = this.unary();
                return { nodeType: NT.Unary, op, expr };
            }
            return this.implicitMultiplication();
        }
        implicitMultiplication() {
            if (this.match([TT.LITERAL_IMAG, TT.LITERAL_REAL, TT.LPAREN, TT.IDENTIFIER], false)) {
                let left = this.power();
                while (this.match([TT.LPAREN, TT.IDENTIFIER], false)) {
                    let right = this.power();
                    left = { nodeType: NT.Binary, op: new Token(TT.STAR, "*", -1), left, right };
                }
                return left;
            }
            return this.power();
        }
        power() {
            return this._binary([TT.CARET], () => this.functionCall());
        }
        functionCall() {
            const callee = this.primary();
            if (callee.nodeType === NT.Variable && this.match([TT.LPAREN])) {
                const args = this.argumentList();
                return { nodeType: NT.FuncCall, callee, args };
            }
            return callee;
        }
        _grouping() {
            const expr = this.expression();
            this.matchOrError([TT.RPAREN], "Unmatched opening parenthesis");
            return { nodeType: NT.Grouping, expr };
        }
        primary() {
            if (this.match([TT.TRUE]))
                return { nodeType: NT.Literal, value: true, dataType: DT.Bool };
            if (this.match([TT.FALSE]))
                return { nodeType: NT.Literal, value: false, dataType: DT.Bool };
            if (this.match([TT.LITERAL_REAL]))
                return { nodeType: NT.Literal, value: this.prev().literal, dataType: DT.Real };
            if (this.match([TT.LITERAL_IMAG]))
                return { nodeType: NT.Literal, value: this.prev().literal, dataType: DT.Imag };
            if (this.match([TT.IDENTIFIER]))
                return { nodeType: NT.Variable, name: this.prev().literal };
            if (this.match([TT.LPAREN]))
                return this._grouping();
            this.error("Expected expression");
        }
    }

    function allCombinations(values, n) {
        if (n === 0)
            return [[]];
        return values.flatMap(v => allCombinations(values, n - 1).map(c => [v].concat(c)));
    }
    function arrayEqual(a, b) {
        if (a.length !== b.length)
            return false;
        return JSON.stringify(a) == JSON.stringify(b);
    }

    const TAB_STR = " ".repeat(4);
    // Takes a type-inferred syntax tree and outputs a glsl string
    // Probably didnt need to be a class but fits with scanner -> parser -> typechecker being classes
    class Transformer {
        constructor(tree) {
            this.indentLevel = 0;
            this.tree = tree;
        }
        _indentStr() {
            return TAB_STR.repeat(this.indentLevel);
        }
        _bracedBlock(node) {
            this.indentLevel += 1;
            const body = this.stmtList(node);
            this.indentLevel -= 1;
            return `{\n${body}\n${this._indentStr()}}`;
        }
        _number(x) {
            let out = x.toString();
            return out.includes(".") ? out : out + ".0";
        }
        transform(node = this.tree) {
            switch (node.nodeType) {
                case NT.StmtList: return this.stmtList(node);
                case NT.Declaration: return this.declaration(node);
                case NT.Assignment: return this.assignment(node);
                case NT.If: return this.if(node);
                case NT.For: return this.for(node);
                case NT.While: return this.while(node);
                case NT.FuncDef: return this.funcDef(node);
                case NT.Break: return this.break(node);
                case NT.Return: return this.return(node);
                case NT.Grouping: return this.grouping(node);
                case NT.Binary: return this.binary(node);
                case NT.Unary: return this.unary(node);
                case NT.Literal: return this.literal(node);
                case NT.Variable: return node.name;
                case NT.FuncCall: return this.funcCall(node);
            }
        }
        stmtList(node) {
            let strs = [];
            for (let stmt of node.statements) {
                let s = this.transform(stmt);
                if (!s.endsWith("}"))
                    s += ";";
                strs.push(s);
            }
            return this._indentStr() + strs.join("\n" + this._indentStr());
        }
        declaration(node) {
            const glslType = typeToGlslType.get(node.value.dataType);
            return `${glslType} ${node.name} = ${this.transform(node.value)}`;
        }
        assignment(node) {
            return `${node.name} = ${this.transform(node.value)}`;
        }
        if(node) {
            let out = `if (${this.transform(node.condition)}) ${this._bracedBlock(node.mainBranch)}`;
            if (node.elseBranch)
                out += ` else ${this._bracedBlock(node.elseBranch)}`;
            return out;
        }
        for(node) {
            let { loopvar, start, end, step, body } = node;
            let startStr = this.transform(start), endStr = this.transform(end), stepStr = this.transform(step);
            return `for (float ${loopvar} = ${startStr}; ${loopvar} <= ${endStr}; ${loopvar} += ${stepStr}) ${this._bracedBlock(body)}`;
        }
        while(node) {
            return `while (${this.transform(node.condition)}) ${this._bracedBlock(node.body)}`;
        }
        funcDef(node) {
            let { name, params, body, dataType } = node;
            let returnTypeStr = typeToGlslType.get(dataType);
            let overloads = [];
            for (let paramTypes of allCombinations(["vec2"], params.length)) {
                let func = `${returnTypeStr} ${name}(${params.map((p, i) => paramTypes[i] + " " + p).join(", ")}) ${this._bracedBlock(body)}`;
                overloads.push(func);
            }
            return overloads.join("\n");
        }
        break(node) {
            return "break";
        }
        return(node) {
            return `return ${this.transform(node.value)}`;
        }
        grouping(node) {
            return `(${this.transform(node.expr)})`;
        }
        binary(node) {
            const leftStr = this.transform(node.left), rightStr = this.transform(node.right);
            const leftType = node.left.dataType, rightType = node.right.dataType;
            const opStr = node.op.lexeme;
            const defaultOut = `${leftStr} ${opStr} ${rightStr}`;
            // Code would be simpler if we just implemented all overloads in complex.glsl
            // But we try to avoid function calls when normal glsl binary ops do the right thing, for performance
            // Dont know if it actually makes a difference but cant hurt
            switch (opStr) {
                case "-":
                case "+":
                    if (leftType === DT.Real && rightType === DT.Imag)
                        return `vec2(${leftStr}, 0.0) ${opStr} ${rightStr}`;
                    if (leftType === DT.Imag && rightType === DT.Real)
                        return `${leftStr} ${opStr} vec2(${rightStr}, 0.0)`;
                    return defaultOut;
                case "*":
                    if (leftType === DT.Imag && rightType === DT.Imag)
                        return `Mul(${leftStr}, ${rightStr})`;
                    return defaultOut;
                case '/':
                    if (rightType === DT.Real)
                        return defaultOut;
                    return `Div(${leftStr}, ${rightStr})`;
                case "^":
                    if (leftStr === "e")
                        return `Exp(${rightStr})`;
                    return `Pow(${leftStr}, ${rightStr})`;
                case "<":
                case ">":
                case "<=":
                case ">=":
                    return defaultOut;
            }
        }
        unary(node) {
            return `${node.op.lexeme}${this.transform(node.expr)}`;
        }
        funcCall(node) {
            const argStrs = node.args.map(x => this.transform(x));
            return `${node.callee.name}(${argStrs.join(', ')})`;
        }
        literal(node) {
            const { dataType: type, value } = node;
            switch (type) {
                case DT.Bool: return value === true ? 'true' : 'false';
                case DT.Real: return this._number(value);
                case DT.Imag: return `vec2(0.0, ${this._number(value)})`;
            }
        }
    }

    const builtinVars = new Map(Object.entries({
        'e': { type: DT.Real, value: Math.exp(1) },
        'pi': { type: DT.Real, value: Math.PI },
    }));
    const sigs = {
        Re_Re_or_Re_Im: [{ out: DT.Real, in: [DT.Real] }, { out: DT.Real, in: [DT.Imag] }],
        Re_Re_or_Im_Im: [{ out: DT.Real, in: [DT.Real] }, { out: DT.Imag, in: [DT.Imag] }],
    };
    const builtinFuncs = new Map(Object.entries({
        're': { glslName: 'Re', signatures: sigs.Re_Re_or_Re_Im },
        'im': { glslName: 'Im', signatures: sigs.Re_Re_or_Re_Im },
        'abs': { glslName: 'Abs', signatures: sigs.Re_Re_or_Re_Im },
        'arg': { glslName: 'Arg', signatures: sigs.Re_Re_or_Re_Im },
        'conj': { glslName: 'Conj', signatures: sigs.Re_Re_or_Im_Im },
        'exp': { glslName: 'Exp', signatures: sigs.Re_Re_or_Im_Im },
        'log': { glslName: 'Log', signatures: sigs.Re_Re_or_Im_Im },
        'sqrt': { glslName: 'Sqrt', signatures: sigs.Re_Re_or_Im_Im },
        'sin': { glslName: 'Sin', signatures: sigs.Re_Re_or_Im_Im },
        'cos': { glslName: 'Cos', signatures: sigs.Re_Re_or_Im_Im },
        'tan': { glslName: 'Tan', signatures: sigs.Re_Re_or_Im_Im },
        'arctan': { glslName: 'Arctan', signatures: sigs.Re_Re_or_Im_Im },
        'arcsin': { glslName: 'Arcsin', signatures: sigs.Re_Re_or_Im_Im },
        'arccos': { glslName: 'Arccos', signatures: sigs.Re_Re_or_Im_Im },
    }));

    class TypeChecker {
        constructor(tree, predeclaredVars) {
            this.insideFuncDef = false;
            this.tree = tree;
            this.currentScope = { env: predeclaredVars || new Map(), parent: null };
            this.declaredFunctions = new Map();
        }
        withNewScope(callback) {
            const prevScope = this.currentScope;
            this.currentScope = { env: new Map(), parent: prevScope };
            const out = callback();
            this.currentScope = prevScope;
            return out;
        }
        lookupVar(name) {
            let scope = this.currentScope;
            while (scope) {
                const v = scope.env.get(name);
                if (v)
                    return v;
                scope = scope.parent;
            }
            return builtinVars.get(name);
        }
        declareVar(name, type) {
            if (builtinVars.has(name) || this.currentScope.env.has(name))
                this.error(`Cannot redeclare variable ${name}`);
            this.currentScope.env.set(name, { type });
        }
        error(msg) {
            throw new TypeErr(msg);
        }
        assertType(types, validTypes, msg) {
            types.forEach(type => { if (!validTypes.includes(type))
                this.error(msg); });
        }
        assertNumeric(types, msg) {
            this.assertType(types, [DT.Real, DT.Imag], msg);
        }
        assertBool(types, msg) {
            this.assertType(types, [DT.Bool], msg);
        }
        typecheckTree() {
            this.typecheck(this.tree);
            let mainFunc = this.declaredFunctions.get(settings.mainFunctionName);
            if (!mainFunc)
                this.error(`Must declare a main function f(z)`);
            const requiredSignature = { in: [DT.Imag], out: DT.Imag };
            console.log(mainFunc.signatures, [requiredSignature]);
            if (!arrayEqual(mainFunc.signatures, [requiredSignature])) {
                this.error(`Main function must be of type Imag -> Imag`);
            }
        }
        typecheck(node) {
            let type;
            switch (node.nodeType) {
                case NT.StmtList:
                    type = this.stmtList(node);
                    break;
                case NT.Declaration:
                    type = this.declaration(node);
                    break;
                case NT.Assignment:
                    type = this.assignment(node);
                    break;
                case NT.If:
                    type = this.if(node);
                    break;
                case NT.For:
                    type = this.for(node);
                    break;
                case NT.While:
                    type = this.while(node);
                    break;
                case NT.FuncDef:
                    type = this.funcDef(node);
                    break;
                case NT.Break: return;
                case NT.Return:
                    type = this.return(node);
                    break;
                case NT.Grouping:
                    type = this.grouping(node);
                    break;
                case NT.Binary:
                    type = this.binary(node);
                    break;
                case NT.Unary:
                    type = this.unary(node);
                    break;
                case NT.Literal:
                    type = this.literal(node);
                    break;
                case NT.Variable:
                    type = this.variable(node);
                    break;
                case NT.FuncCall:
                    type = this.funcCall(node);
                    break;
            }
            node.dataType = type;
            return type;
        }
        // Statements
        stmtList(node) {
            node.statements.forEach(this.typecheck.bind(this));
        }
        declaration(node) {
            const rhsType = this.typecheck(node.value);
            this.declareVar(node.name, rhsType);
        }
        assignment(node) {
            if (builtinVars.has(node.name))
                this.error(`Cannot reassign builtin variable ${node.name}`);
            let v = this.lookupVar(node.name);
            if (!v)
                this.error(`Cannot assign to undeclared variable ${node.name}`);
            const rhsType = this.typecheck(node.value);
            if (v.type !== rhsType) {
                this.error(`Cannot reassign ${node.name} from type ${DT[v.type]} to ${DT[rhsType]}`);
            }
        }
        if(node) {
            this.assertType([this.typecheck(node.condition)], [DT.Bool], "Condition in if-statement is not of type Bool");
            this.withNewScope(() => this.typecheck(node.mainBranch));
            if (node.elseBranch)
                this.withNewScope(() => this.typecheck(node.elseBranch));
        }
        for(node) {
            const [startType, endType, stepType] = [node.start, node.end, node.step].map(x => this.typecheck(x));
            this.assertType([startType, endType, stepType], [DT.Real], "For-loop bounds are not of type Real");
            this.withNewScope(() => {
                this.declareVar(node.loopvar, DT.Real);
                this.typecheck(node.body);
            });
        }
        while(node) {
            this.assertType([this.typecheck(node.condition)], [DT.Bool], "Condition in while-loop is not of type Bool");
            this.withNewScope(() => this.typecheck(node.body));
        }
        funcDef(node) {
            if (this.declaredFunctions.has(node.name) || builtinFuncs.has(node.name)) {
                this.error(`Cannot redeclare function ${node.name}`);
            }
            this.insideFuncDef = true;
            this.currentFunction = { name: node.name, returnType: null };
            const inputTypes = node.params.map(x => DT.Imag); // only allowing imaginary params in user defined functions for now
            this.withNewScope(() => {
                node.params.forEach((x, i) => this.declareVar(x, inputTypes[i]));
                this.typecheck(node.body);
            });
            const returnType = this.currentFunction.returnType; // should be set when typechecking body and encountering return
            if (!returnType)
                this.error(`Function ${node.name} doesnt return a value`);
            const signature = { in: inputTypes, out: returnType };
            this.declaredFunctions.set(node.name, { signatures: [signature] });
            this.insideFuncDef = false;
            return returnType;
        }
        return(node) {
            const type = this.typecheck(node.value);
            if (this.currentFunction.returnType && this.currentFunction.returnType !== type) {
                this.error(`Function ${this.currentFunction.name} has multiple possible return types`);
            }
            this.currentFunction.returnType = type;
        }
        // Expressions
        grouping(node) {
            return this.typecheck(node.expr);
        }
        binary(node) {
            const { left, right, op } = node;
            const leftType = this.typecheck(left), rightType = this.typecheck(right);
            if (["+", "-", "*", "/", "^"].includes(op.lexeme)) {
                this.assertNumeric([leftType, rightType], `Wrong operand types for ${op.lexeme}: ${DT[leftType]}, ${DT[rightType]}`);
                if (leftType === DT.Real && rightType === DT.Real)
                    return DT.Real;
                return DT.Imag;
            }
            if (["<", ">", "<=", ">="].includes(op.lexeme)) {
                this.assertType([leftType, rightType], [DT.Real], `Wrong operand types for ${op.lexeme}: ${DT[leftType]}, ${DT[rightType]}`);
                return DT.Bool;
            }
        }
        unary(node) {
            const operandType = this.typecheck(node.expr);
            const opStr = node.op.lexeme;
            const errMsg = `Wrong operand type for unary ${opStr}: ${DT[operandType]}`;
            if (opStr === "-")
                this.assertNumeric([operandType], errMsg);
            if (opStr === "!")
                this.assertBool([operandType], errMsg);
            return operandType;
        }
        literal(node) {
            console.assert(node.dataType !== undefined); // should have been set in parsing
            return node.dataType;
        }
        variable(node) {
            let v = this.lookupVar(node.name);
            if (!v)
                this.error(`Undeclared variable ${node.name}`);
            return v.type;
        }
        funcCall(node) {
            let name = node.callee.name;
            let f = builtinFuncs.get(name);
            if (f)
                node.callee.name = f.glslName;
            else
                f = this.declaredFunctions.get(name);
            if (!f)
                this.error(`Undeclared function ${name}`);
            const inputTypes = node.args.map(expr => this.typecheck(expr));
            for (let sig of f.signatures) {
                if (arrayEqual(sig.in, inputTypes))
                    return sig.out;
            }
            this.error(`Wrong argument types for ${name}: [${inputTypes.map(t => DT[t]).join(', ')}]`);
        }
    }

    const settings = {
        maxFunctionParams: 5,
        mainFunctionName: "f",
    };
    function compile(src, userVariables, skipTypeCheck = false) {
        let tokens, astTree, glslString, errors = [];
        try {
            let scanner = new Scanner(src);
            tokens = scanner.scan();
            let parser = new Parser(tokens);
            astTree = parser.parse();
            const varEnv = new Map();
            for (const [name, type] of userVariables.entries()) {
                varEnv.set(name, { type: glslTypeToDT.get(type) });
            }
            let typechecker = new TypeChecker(astTree, varEnv);
            if (!skipTypeCheck)
                typechecker.typecheckTree();
            let transformer = new Transformer(astTree);
            glslString = transformer.transform();
        }
        catch (err) {
            if (err instanceof CompileError) {
                errors.push(err);
            }
            else {
                console.error("Internal compiler error");
                throw err;
            }
        }
        return { tokens, astTree, glslString, errors };
    }
    // let output = compile("x := 1; x := 2")
    // if (output.errors.length > 0) console.log(output.errors.map(e => e.toString()))
    // // console.log(treeAsJson(output.astTree))
    // console.log(output.glslString)

    class Canvas {
        constructor(canvas, workspace) {
            this.mousePos = { x: 0, y: 0 };
            this.defaultSettings = new Map(Object.entries({
                'showGrid': { type: 'bool', value: false },
                'gridSpacing': { type: 'float', value: 1.0 },
                'showModContours': { type: 'bool', value: true },
                'showPhaseContours': { type: 'bool', value: false },
                'polarCoords': { type: 'bool', value: false },
            }));
            this.settings = cloneMap(this.defaultSettings);
            this.c = canvas;
            this.mousePos = { x: 0, y: 0 };
            this.defaultWorkspace = workspace;
            uvars.set(workspace.vars);
            this.compileUserCodeToGlsl(workspace.code, false);
        }
        updateSetting(name, value, render = true) {
            if (!this.settings.has(name))
                throw new Error(`setting ${name} doesnt exist`);
            this.settings.get(name).value = value;
            if (this.mainProgram.uniforms.has(`u_${name}`)) {
                this.mainProgram.setUniformValue(`u_${name}`, value);
            }
            if (render)
                this.render();
        }
        getSetting(name) {
            if (!this.settings.has(name))
                throw new Error(`setting ${name} doesnt exist`);
            return this.settings.get(name).value;
        }
        addUniform(name, value = null, type = "float") {
            this.mainProgram.addUniform(new Uniform(name, type));
            this.compProgram.addUniform(new Uniform(name, type));
            this.setUniformValue(name, value);
        }
        deleteUniform(name) {
            this.mainProgram.deleteUniform(name);
            this.compProgram.deleteUniform(name);
        }
        setUniformValue(name, value) {
            this.mainProgram.setUniformValue(name, value);
            this.compProgram.setUniformValue(name, value);
        }
        addUniformsFromWorkspace(workspace) {
            workspace.vars.forEach(v => {
                if (v.type === "float")
                    this.addUniform(v.name, v.value, "float");
                if (v.type === "vec2")
                    this.addUniform(v.name, [v.x, v.y], "vec2");
            });
        }
        loadNewWorkSpace(workspace) {
            get_store_value(uvars).forEach(v => this.deleteUniform(v.name));
            uvars.set(workspace.vars);
            this.addUniformsFromWorkspace(workspace);
            this.compileUserCodeToGlsl(workspace.code, true);
        }
        recompilePrograms() {
            console.log(this.mainProgram.uniforms);
            try {
                this.mainProgram.recompile(this.userCodeGlsl);
                this.compProgram.recompile(this.userCodeGlsl);
            }
            catch (e) {
                compilationErrors.set([e]);
                return;
            }
            compilationErrors.set([]);
            this.render();
        }
        compileUserCodeToGlsl(src, recompileProgramsAfter = true) {
            const uvarsSimple = new Map(get_store_value(uvars).map(x => [x.name, x.type]));
            console.log(uvarsSimple);
            const cOut = compile(src, uvarsSimple);
            console.log("compiler output: ", cOut);
            if (cOut.errors.length > 0) {
                compilationErrors.set(cOut.errors);
            }
            else {
                compilationErrors.set([]);
                this.userCodeGlsl = cOut.glslString;
                if (recompileProgramsAfter)
                    this.recompilePrograms(); // should always happen except on init
            }
        }
        computeFval(p) {
            const gl = this.gl;
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.compFbo);
            gl.useProgram(this.compProgram.id);
            this.compProgram.setUniformValue("u_point", [p.x, p.y]);
            this.compProgram.bindAllUniforms();
            gl.viewport(0, 0, this.c.width, this.c.height);
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.POINTS, 0, 1);
            let pixel = new Float32Array(4);
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixel);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return { x: pixel[0], y: pixel[1] };
        }
        renderShapes() {
            const gl = this.gl;
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.useProgram(this.shapeProgram.id);
            this.shapeProgram.setUniformValue("u_worldMat", this.camera.getWorldMatrix());
            this.shapeProgram.setUniformValue("u_resolution", [this.c.width, this.c.height]);
            this.shapeProgram.setUniformValue("u_scale", [this.camera.scale.x, this.camera.scale.y]);
            this.shapeProgram.bindAllUniforms();
            gl.viewport(0, 0, this.c.width, this.c.height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disable(gl.BLEND);
        }
        render(once = true) {
            const gl = this.gl;
            gl.viewport(0, 0, this.c.width, this.c.height);
            gl.clearColor(0.42, 0.42, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.useProgram(this.mainProgram.id);
            this.mainProgram.setUniformValue("u_worldMat", this.camera.getWorldMatrix());
            this.mainProgram.setUniformValue("u_mouse", [this.mousePos.x, this.mousePos.y]);
            this.mainProgram.setUniformValue("u_resolution", [this.c.width, this.c.height]);
            this.mainProgram.setUniformValue("u_scale", [this.camera.scale.x, this.camera.scale.y]);
            console.log(this.camera.scale);
            this.mainProgram.bindAllUniforms();
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            this.renderShapes();
            if (!once)
                requestAnimationFrame(() => this.render(once));
        }
        init(error) {
            return __awaiter(this, void 0, void 0, function* () {
                const c = this.c;
                resizeCanvasToDisplaySize(c);
                const gl = c.getContext("webgl2");
                if (!gl) {
                    error("No WebGL2 context");
                    return;
                }
                this.gl = gl;
                this.camera = new Camera(c, { setEventListeners: false });
                let ext = gl.getExtension('EXT_color_buffer_float');
                if (!ext) {
                    error("EXT_color_buffer_float not supported");
                    return;
                }
                let mainProgram = new ProgramManager(gl, [
                    new Uniform("u_worldMat", "mat3"),
                    new Uniform("u_mouse", "vec2"),
                    new Uniform("u_resolution", "vec2"),
                    new Uniform("u_scale", "vec2"),
                ]);
                this.settings.forEach((v, k) => {
                    mainProgram.addUniform(new Uniform(`u_${k}`, v.type, v.value));
                });
                this.mainProgram = mainProgram;
                // console.table(Array.from(mainProgram.uniforms.values()).map(u => [u.name, u.value]))
                let compProgram = new ProgramManager(gl, [
                    new Uniform("u_point", "vec2"),
                ]);
                this.compProgram = compProgram;
                let shapeProgram = new ProgramManager(gl, [
                    new Uniform("u_worldMat", "mat3"),
                    new Uniform("u_resolution", "vec2"),
                    new Uniform("u_scale", "vec2"),
                ]);
                this.shapeProgram = shapeProgram;
                this.addUniformsFromWorkspace(this.defaultWorkspace);
                yield mainProgram.compileFromUrls("shaders/main/vertex.glsl", "shaders/main/fragment.glsl", this.userCodeGlsl);
                yield compProgram.compileFromUrls("shaders/comp-fval/vertex.glsl", "shaders/comp-fval/fragment.glsl", this.userCodeGlsl);
                yield shapeProgram.compileFromUrls("shaders/shapes/vertex.glsl", "shaders/shapes/fragment.glsl", this.userCodeGlsl);
                if (!(mainProgram && compProgram && shapeProgram)) {
                    return;
                }
                bufferFullscreenQuad(gl, gl.getAttribLocation(mainProgram.id, "a_position"));
                bufferFullscreenQuad(gl, gl.getAttribLocation(shapeProgram.id, "a_position"));
                // setup framebuffer for computing and reading f(z) in computeFval
                let compFbo = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, compFbo);
                let texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
                this.compFbo = compFbo;
            });
        }
    }

    /* src/components/CoordinateBox.svelte generated by Svelte v3.55.1 */
    const file$8 = "src/components/CoordinateBox.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let p0;
    	let t0;
    	let t1_value = /*formatPoint*/ ctx[2](/*mouse*/ ctx[0]) + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let t4_value = /*formatPoint*/ ctx[2](/*fval*/ ctx[1]) + "";
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("   z = ");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("f(z) = ");
    			t4 = text(t4_value);
    			attr_dev(p0, "class", "svelte-1qvof95");
    			add_location(p0, file$8, 26, 4, 694);
    			attr_dev(p1, "class", "svelte-1qvof95");
    			add_location(p1, file$8, 27, 4, 743);
    			attr_dev(div, "id", "coordinate-box");
    			attr_dev(div, "class", "svelte-1qvof95");
    			add_location(div, file$8, 25, 0, 664);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, t1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*mouse*/ 1 && t1_value !== (t1_value = /*formatPoint*/ ctx[2](/*mouse*/ ctx[0]) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*fval*/ 2 && t4_value !== (t4_value = /*formatPoint*/ ctx[2](/*fval*/ ctx[1]) + "")) set_data_dev(t4, t4_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatNum(x) {
    	if (Math.abs(x) < 0.001 || Math.abs(x) >= 1000) return x.toExponential(3); else return x.toFixed(3);
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CoordinateBox', slots, []);
    	let { mouse } = $$props;
    	let { fval } = $$props;
    	let { canvas } = $$props;

    	function formatPoint(p) {
    		if (canvas.getSetting('polarCoords')) {
    			let { r, theta } = rectToPolar(p.x, p.y);
    			return `${formatNum(r)} ∠ ${formatNum(theta / Math.PI)} π`;
    		} else {
    			if (p.y < 0) return `${formatNum(p.x)} - ${formatNum(-p.y)}i`; else return `${formatNum(p.x)} + ${formatNum(p.y)}i`;
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (mouse === undefined && !('mouse' in $$props || $$self.$$.bound[$$self.$$.props['mouse']])) {
    			console.warn("<CoordinateBox> was created without expected prop 'mouse'");
    		}

    		if (fval === undefined && !('fval' in $$props || $$self.$$.bound[$$self.$$.props['fval']])) {
    			console.warn("<CoordinateBox> was created without expected prop 'fval'");
    		}

    		if (canvas === undefined && !('canvas' in $$props || $$self.$$.bound[$$self.$$.props['canvas']])) {
    			console.warn("<CoordinateBox> was created without expected prop 'canvas'");
    		}
    	});

    	const writable_props = ['mouse', 'fval', 'canvas'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CoordinateBox> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('mouse' in $$props) $$invalidate(0, mouse = $$props.mouse);
    		if ('fval' in $$props) $$invalidate(1, fval = $$props.fval);
    		if ('canvas' in $$props) $$invalidate(3, canvas = $$props.canvas);
    	};

    	$$self.$capture_state = () => ({
    		rectToPolar,
    		mouse,
    		fval,
    		canvas,
    		formatPoint,
    		formatNum
    	});

    	$$self.$inject_state = $$props => {
    		if ('mouse' in $$props) $$invalidate(0, mouse = $$props.mouse);
    		if ('fval' in $$props) $$invalidate(1, fval = $$props.fval);
    		if ('canvas' in $$props) $$invalidate(3, canvas = $$props.canvas);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [mouse, fval, formatPoint, canvas];
    }

    class CoordinateBox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { mouse: 0, fval: 1, canvas: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CoordinateBox",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get mouse() {
    		throw new Error("<CoordinateBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mouse(value) {
    		throw new Error("<CoordinateBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fval() {
    		throw new Error("<CoordinateBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fval(value) {
    		throw new Error("<CoordinateBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get canvas() {
    		throw new Error("<CoordinateBox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canvas(value) {
    		throw new Error("<CoordinateBox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Navbar.svelte generated by Svelte v3.55.1 */

    const file$7 = "src/components/Navbar.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (8:4) {#each tabs as tab}
    function create_each_block$3(ctx) {
    	let button;
    	let t0_value = /*tab*/ ctx[3].name + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[2](/*tab*/ ctx[3]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "tab svelte-o94sru");
    			toggle_class(button, "active", /*tab*/ ctx[3].id == /*activeTab*/ ctx[0].id);
    			add_location(button, file$7, 8, 8, 164);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*tabs*/ 2 && t0_value !== (t0_value = /*tab*/ ctx[3].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*tabs, activeTab*/ 3) {
    				toggle_class(button, "active", /*tab*/ ctx[3].id == /*activeTab*/ ctx[0].id);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(8:4) {#each tabs as tab}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let each_value = /*tabs*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "navbar");
    			attr_dev(div, "class", "svelte-o94sru");
    			add_location(div, file$7, 6, 0, 114);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*tabs, activeTab*/ 3) {
    				each_value = /*tabs*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	let { tabs } = $$props;
    	let { activeTab } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (tabs === undefined && !('tabs' in $$props || $$self.$$.bound[$$self.$$.props['tabs']])) {
    			console.warn("<Navbar> was created without expected prop 'tabs'");
    		}

    		if (activeTab === undefined && !('activeTab' in $$props || $$self.$$.bound[$$self.$$.props['activeTab']])) {
    			console.warn("<Navbar> was created without expected prop 'activeTab'");
    		}
    	});

    	const writable_props = ['tabs', 'activeTab'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = tab => $$invalidate(0, activeTab = tab);

    	$$self.$$set = $$props => {
    		if ('tabs' in $$props) $$invalidate(1, tabs = $$props.tabs);
    		if ('activeTab' in $$props) $$invalidate(0, activeTab = $$props.activeTab);
    	};

    	$$self.$capture_state = () => ({ tabs, activeTab });

    	$$self.$inject_state = $$props => {
    		if ('tabs' in $$props) $$invalidate(1, tabs = $$props.tabs);
    		if ('activeTab' in $$props) $$invalidate(0, activeTab = $$props.activeTab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [activeTab, tabs, click_handler];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { tabs: 1, activeTab: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get tabs() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabs(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeTab() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeTab(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const codes = {
        identity: `f(z) := z`,
        juliaSetStandard: `g(z) := z^2 + c

f(z) := 
  for j = 1..N: z = g(z)
  return z`,
        juliaSetBurningShip: `g(z) := (abs(re(z)) + i abs(im(z)))^x + c

f(z) := 
  for j = 1..N: z = g(z)
  return z`,
        mandelbrotStandard: `g(z, c) := z^x + c

f(c) := 
  w := 0 + 0i
  for j = 1..N: 
    if abs(w) > 2: break
    w = g(w, c)
  return w`
    };
    function makeSlider(name, value, min = -10, max = 10, step = 0.001) {
        return { id: v4(), type: "float", name, value, min, max, step };
    }
    function makePoint(name, x = 0, y = 0, color = randomColorRGB()) {
        return { id: v4(), type: "vec2", name, x, y, color };
    }
    const workspaceExamples = {
        identity: {
            code: codes.identity,
            vars: []
        },
        juliaSetStandard: {
            code: codes.juliaSetStandard,
            vars: [makeSlider("N", 50, 0, 100, 1), makePoint("c", 0.272, 0.575)]
        },
        juliaSetBurningShip1: {
            code: codes.juliaSetBurningShip,
            vars: [makeSlider("N", 100, 0, 100, 1), makePoint("c", -0.128, -0.847), makeSlider("x", 2.0)]
        },
        juliaSetBurningShip2: {
            code: codes.juliaSetBurningShip,
            vars: [makeSlider("N", 100, 0, 100, 1), makePoint("c", -0.371, 0.412), makeSlider("x", -1.46939)]
        },
        mandelbrotStandard: {
            code: codes.mandelbrotStandard,
            vars: [makeSlider("N", 100, 0, 100, 1), makeSlider("x", 2.0)]
        },
    };
    const defaultWorkspaceName = "identity";

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/components/Editor.svelte generated by Svelte v3.55.1 */

    const { Object: Object_1, console: console_1$4 } = globals;
    const file$6 = "src/components/Editor.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i][0];
    	child_ctx[22] = list[i][1];
    	return child_ctx;
    }

    // (57:8) {#if showExamples}
    function create_if_block_2$2(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let each_value_1 = Object.entries(workspaceExamples);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "examples-container");
    			attr_dev(div, "class", "svelte-iy1tqz");
    			add_location(div, file$6, 57, 8, 2027);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, workspaceExamples, currentExampleName, onSelectExample*/ 272) {
    				each_value_1 = Object.entries(workspaceExamples);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 100 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 100 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(57:8) {#if showExamples}",
    		ctx
    	});

    	return block;
    }

    // (59:12) {#each Object.entries(workspaceExamples) as [name, example]}
    function create_each_block_1(ctx) {
    	let button;
    	let t_value = /*name*/ ctx[21] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[15](/*name*/ ctx[21], /*example*/ ctx[22]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-iy1tqz");
    			toggle_class(button, "selected", /*name*/ ctx[21] === /*currentExampleName*/ ctx[4]);
    			add_location(button, file$6, 59, 16, 2180);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*Object, workspaceExamples, currentExampleName*/ 16) {
    				toggle_class(button, "selected", /*name*/ ctx[21] === /*currentExampleName*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(59:12) {#each Object.entries(workspaceExamples) as [name, example]}",
    		ctx
    	});

    	return block;
    }

    // (73:0) {#if $compilationErrors.length > 0}
    function create_if_block_1$4(ctx) {
    	let div;
    	let each_value = /*$compilationErrors*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "error-div");
    			attr_dev(div, "class", "svelte-iy1tqz");
    			add_location(div, file$6, 73, 4, 2607);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$compilationErrors*/ 64) {
    				each_value = /*$compilationErrors*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(73:0) {#if $compilationErrors.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (75:8) {#each $compilationErrors as err, i}
    function create_each_block$2(ctx) {
    	let p;
    	let t_value = /*err*/ ctx[18].toString() + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-iy1tqz");
    			add_location(p, file$6, 75, 8, 2681);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$compilationErrors*/ 64 && t_value !== (t_value = /*err*/ ctx[18].toString() + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(75:8) {#each $compilationErrors as err, i}",
    		ctx
    	});

    	return block;
    }

    // (81:0) {#if showGlslOutput}
    function create_if_block$4(ctx) {
    	let span;
    	let t1;
    	let pre;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Transpiled glsl:";
    			t1 = space();
    			pre = element("pre");
    			t2 = text(/*glslOutput*/ ctx[2]);
    			set_style(span, "color", `var(--c-white)`);
    			add_location(span, file$6, 81, 4, 2764);
    			attr_dev(pre, "id", "glsl-output");
    			attr_dev(pre, "class", "svelte-iy1tqz");
    			add_location(pre, file$6, 82, 4, 2828);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*glslOutput*/ 4) set_data_dev(t2, /*glslOutput*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(pre);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(81:0) {#if showGlslOutput}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let div0;
    	let button2;
    	let t5;
    	let t6;
    	let pre;
    	let t7;
    	let t8;
    	let t9;
    	let if_block2_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*showExamples*/ ctx[5] && create_if_block_2$2(ctx);
    	let if_block1 = /*$compilationErrors*/ ctx[6].length > 0 && create_if_block_1$4(ctx);
    	let if_block2 = /*showGlslOutput*/ ctx[3] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Show glsl";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Reset";
    			t3 = space();
    			div0 = element("div");
    			button2 = element("button");
    			button2.textContent = "Examples";
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			pre = element("pre");
    			t7 = text(/*code*/ ctx[0]);
    			t8 = space();
    			if (if_block1) if_block1.c();
    			t9 = space();
    			if (if_block2) if_block2.c();
    			if_block2_anchor = empty();
    			attr_dev(button0, "class", "svelte-iy1tqz");
    			toggle_class(button0, "selected", /*showGlslOutput*/ ctx[3]);
    			add_location(button0, file$6, 52, 4, 1680);
    			attr_dev(button1, "class", "svelte-iy1tqz");
    			add_location(button1, file$6, 53, 4, 1793);
    			attr_dev(button2, "class", "svelte-iy1tqz");
    			toggle_class(button2, "selected", /*showExamples*/ ctx[5]);
    			add_location(button2, file$6, 55, 8, 1890);
    			attr_dev(div0, "id", "tooltip-container");
    			attr_dev(div0, "class", "svelte-iy1tqz");
    			add_location(div0, file$6, 54, 4, 1853);
    			attr_dev(div1, "id", "buttons-div");
    			attr_dev(div1, "class", "svelte-iy1tqz");
    			add_location(div1, file$6, 51, 0, 1653);
    			attr_dev(pre, "id", "editor");
    			attr_dev(pre, "contenteditable", "true");
    			attr_dev(pre, "class", "svelte-iy1tqz");
    			toggle_class(pre, "error", /*$compilationErrors*/ ctx[6].length > 0);
    			add_location(pre, file$6, 67, 0, 2385);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(div1, t1);
    			append_dev(div1, button1);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, button2);
    			append_dev(div0, t5);
    			if (if_block0) if_block0.m(div0, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, pre, anchor);
    			append_dev(pre, t7);
    			/*pre_binding*/ ctx[16](pre);
    			insert_dev(target, t8, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t9, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, if_block2_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[13], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[14], false, false, false),
    					listen_dev(pre, "input", /*handleInput*/ ctx[9], false, false, false),
    					listen_dev(pre, "keydown", /*handleKeyDown*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*showGlslOutput*/ 8) {
    				toggle_class(button0, "selected", /*showGlslOutput*/ ctx[3]);
    			}

    			if (!current || dirty & /*showExamples*/ 32) {
    				toggle_class(button2, "selected", /*showExamples*/ ctx[5]);
    			}

    			if (/*showExamples*/ ctx[5]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*showExamples*/ 32) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2$2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*code*/ 1) set_data_dev(t7, /*code*/ ctx[0]);

    			if (!current || dirty & /*$compilationErrors*/ 64) {
    				toggle_class(pre, "error", /*$compilationErrors*/ ctx[6].length > 0);
    			}

    			if (/*$compilationErrors*/ ctx[6].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$4(ctx);
    					if_block1.c();
    					if_block1.m(t9.parentNode, t9);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*showGlslOutput*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$4(ctx);
    					if_block2.c();
    					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(pre);
    			/*pre_binding*/ ctx[16](null);
    			if (detaching) detach_dev(t8);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t9);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(if_block2_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const tabsize = 4;

    function instance$6($$self, $$props, $$invalidate) {
    	let $compilationErrors;
    	validate_store(compilationErrors, 'compilationErrors');
    	component_subscribe($$self, compilationErrors, $$value => $$invalidate(6, $compilationErrors = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Editor', slots, []);
    	let { canvas } = $$props;
    	let { code } = $$props;
    	let preElem;
    	let glslOutput = canvas.userCodeGlsl;
    	let showGlslOutput = false;
    	let currentExampleName = defaultWorkspaceName;
    	const initText = code;
    	let showExamples = false;

    	function onSelectExample(name, example) {
    		console.log("select", name, example);
    		$$invalidate(4, currentExampleName = name);
    		$$invalidate(0, code = example.code);
    		canvas.loadNewWorkSpace(example);
    	}

    	document.addEventListener("click", e => {
    		if (showExamples && !e.target.closest("#examples-container") && !e.target.closest("#tooltip-container")) {
    			$$invalidate(5, showExamples = false);
    		}
    	});

    	function handleInput(e) {
    		$$invalidate(0, code = e.target.innerText);
    		canvas.compileUserCodeToGlsl(code, true);
    		$$invalidate(2, glslOutput = canvas.userCodeGlsl);
    		$compilationErrors.forEach(err => console.error(err.toString()));
    	}

    	function insertTab() {
    		let selection = window.getSelection();
    		selection.getRangeAt(0).startOffset;
    		let focus = selection.focusNode;
    		let offset = selection.focusOffset;

    		// focus.textContent = code.slice(0, cursorPos) + " ".repeat(tabsize) + code.slice(cursorPos);
    		let range = document.createRange();

    		range.selectNode(focus);
    		range.setStart(focus, offset + tabsize);
    		range.collapse(true);
    		selection.removeAllRanges();
    		selection.addRange(range);
    		$$invalidate(0, code = preElem.innerText);
    	}

    	function handleKeyDown(e) {
    		if (e.key === "Tab") {
    			e.preventDefault();
    			insertTab();
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (canvas === undefined && !('canvas' in $$props || $$self.$$.bound[$$self.$$.props['canvas']])) {
    			console_1$4.warn("<Editor> was created without expected prop 'canvas'");
    		}

    		if (code === undefined && !('code' in $$props || $$self.$$.bound[$$self.$$.props['code']])) {
    			console_1$4.warn("<Editor> was created without expected prop 'code'");
    		}
    	});

    	const writable_props = ['canvas', 'code'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$4.warn(`<Editor> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(3, showGlslOutput = !showGlslOutput);
    	const click_handler_1 = () => $$invalidate(0, code = initText);
    	const click_handler_2 = () => $$invalidate(5, showExamples = !showExamples);
    	const click_handler_3 = (name, example) => onSelectExample(name, example);

    	function pre_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			preElem = $$value;
    			$$invalidate(1, preElem);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('canvas' in $$props) $$invalidate(11, canvas = $$props.canvas);
    		if ('code' in $$props) $$invalidate(0, code = $$props.code);
    	};

    	$$self.$capture_state = () => ({
    		compilationErrors,
    		workspaceExamples,
    		defaultWorkspaceName,
    		fade,
    		canvas,
    		code,
    		preElem,
    		glslOutput,
    		showGlslOutput,
    		currentExampleName,
    		initText,
    		showExamples,
    		tabsize,
    		onSelectExample,
    		handleInput,
    		insertTab,
    		handleKeyDown,
    		$compilationErrors
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvas' in $$props) $$invalidate(11, canvas = $$props.canvas);
    		if ('code' in $$props) $$invalidate(0, code = $$props.code);
    		if ('preElem' in $$props) $$invalidate(1, preElem = $$props.preElem);
    		if ('glslOutput' in $$props) $$invalidate(2, glslOutput = $$props.glslOutput);
    		if ('showGlslOutput' in $$props) $$invalidate(3, showGlslOutput = $$props.showGlslOutput);
    		if ('currentExampleName' in $$props) $$invalidate(4, currentExampleName = $$props.currentExampleName);
    		if ('showExamples' in $$props) $$invalidate(5, showExamples = $$props.showExamples);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		code,
    		preElem,
    		glslOutput,
    		showGlslOutput,
    		currentExampleName,
    		showExamples,
    		$compilationErrors,
    		initText,
    		onSelectExample,
    		handleInput,
    		handleKeyDown,
    		canvas,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		pre_binding
    	];
    }

    class Editor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { canvas: 11, code: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Editor",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get canvas() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canvas(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get code() {
    		throw new Error("<Editor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set code(value) {
    		throw new Error("<Editor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ResizableInput.svelte generated by Svelte v3.55.1 */

    const file$5 = "src/components/ResizableInput.svelte";

    // (12:32) 
    function create_if_block_1$3(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "step", /*step*/ ctx[2]);
    			attr_dev(input, "class", "svelte-12nxz13");
    			add_location(input, file$5, 11, 32, 384);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_1*/ ctx[6]),
    					listen_dev(input, "input", /*input_handler_1*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*step*/ 4) {
    				attr_dev(input, "step", /*step*/ ctx[2]);
    			}

    			if (dirty & /*value*/ 1 && to_number(input.value) !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(12:32) ",
    		ctx
    	});

    	return block;
    }

    // (11:4) {#if type === "text"}
    function create_if_block$3(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-12nxz13");
    			add_location(input, file$5, 10, 32, 304);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(input, "input", /*input_handler*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(11:4) {#if type === \\\"text\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[1] === "text") return create_if_block$3;
    		if (/*type*/ ctx[1] === "number") return create_if_block_1$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text(/*value*/ ctx[0]);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "svelte-12nxz13");
    			add_location(span, file$5, 8, 4, 174);
    			attr_dev(div, "id", "container");
    			attr_dev(div, "class", "svelte-12nxz13");
    			add_location(div, file$5, 7, 0, 149);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(div, t1);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) set_data_dev(t0, /*value*/ ctx[0]);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ResizableInput', slots, []);
    	let { type } = $$props;
    	let { value } = $$props;
    	let { step = 0.001 } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (type === undefined && !('type' in $$props || $$self.$$.bound[$$self.$$.props['type']])) {
    			console.warn("<ResizableInput> was created without expected prop 'type'");
    		}

    		if (value === undefined && !('value' in $$props || $$self.$$.bound[$$self.$$.props['value']])) {
    			console.warn("<ResizableInput> was created without expected prop 'value'");
    		}
    	});

    	const writable_props = ['type', 'value', 'step'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ResizableInput> was created with unknown prop '${key}'`);
    	});

    	function input_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function input_input_handler_1() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('type' in $$props) $$invalidate(1, type = $$props.type);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('step' in $$props) $$invalidate(2, step = $$props.step);
    	};

    	$$self.$capture_state = () => ({ type, value, step });

    	$$self.$inject_state = $$props => {
    		if ('type' in $$props) $$invalidate(1, type = $$props.type);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('step' in $$props) $$invalidate(2, step = $$props.step);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		value,
    		type,
    		step,
    		input_handler,
    		input_handler_1,
    		input_input_handler,
    		input_input_handler_1
    	];
    }

    class ResizableInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { type: 1, value: 0, step: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ResizableInput",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get type() {
    		throw new Error("<ResizableInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<ResizableInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<ResizableInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<ResizableInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<ResizableInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<ResizableInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Variable.svelte generated by Svelte v3.55.1 */

    const { console: console_1$3 } = globals;
    const file$4 = "src/components/Variable.svelte";

    // (53:8) {#if data.type === "vec2"}
    function create_if_block_5(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "color");
    			attr_dev(input, "id", "color-picker");
    			attr_dev(input, "class", "svelte-fbb8yg");
    			set_style(input, "background-color", /*data*/ ctx[0].color);
    			add_location(input, file$4, 53, 12, 1429);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*data*/ ctx[0].color);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    					listen_dev(input, "input", /*onValueChange*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1) {
    				set_input_value(input, /*data*/ ctx[0].color);
    			}

    			if (dirty & /*data*/ 1) {
    				set_style(input, "background-color", /*data*/ ctx[0].color);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(53:8) {#if data.type === \\\"vec2\\\"}",
    		ctx
    	});

    	return block;
    }

    // (67:39) 
    function create_if_block_4$1(ctx) {
    	let resizableinput0;
    	let t0;
    	let span0;
    	let t2;
    	let resizableinput1;
    	let t3;
    	let span1;
    	let current;

    	resizableinput0 = new ResizableInput({
    			props: {
    				type: "number",
    				value: /*displayX*/ ctx[2],
    				step: 0.001
    			},
    			$$inline: true
    		});

    	resizableinput0.$on("input", /*input_handler*/ ctx[12]);

    	resizableinput1 = new ResizableInput({
    			props: {
    				type: "number",
    				value: /*displayY*/ ctx[3],
    				step: 0.001
    			},
    			$$inline: true
    		});

    	resizableinput1.$on("input", /*input_handler_1*/ ctx[13]);

    	const block = {
    		c: function create() {
    			create_component(resizableinput0.$$.fragment);
    			t0 = space();
    			span0 = element("span");
    			span0.textContent = "+";
    			t2 = space();
    			create_component(resizableinput1.$$.fragment);
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "i";
    			attr_dev(span0, "class", "non-clickable svelte-fbb8yg");
    			add_location(span0, file$4, 68, 76, 2126);
    			attr_dev(span1, "class", "non-clickable letter-i svelte-fbb8yg");
    			add_location(span1, file$4, 70, 76, 2299);
    		},
    		m: function mount(target, anchor) {
    			mount_component(resizableinput0, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(resizableinput1, target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span1, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const resizableinput0_changes = {};
    			if (dirty & /*displayX*/ 4) resizableinput0_changes.value = /*displayX*/ ctx[2];
    			resizableinput0.$set(resizableinput0_changes);
    			const resizableinput1_changes = {};
    			if (dirty & /*displayY*/ 8) resizableinput1_changes.value = /*displayY*/ ctx[3];
    			resizableinput1.$set(resizableinput1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(resizableinput0.$$.fragment, local);
    			transition_in(resizableinput1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(resizableinput0.$$.fragment, local);
    			transition_out(resizableinput1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(resizableinput0, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t2);
    			destroy_component(resizableinput1, detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(67:39) ",
    		ctx
    	});

    	return block;
    }

    // (64:8) {#if data.type === "float"}
    function create_if_block_3$1(ctx) {
    	let input;
    	let input_min_value;
    	let input_max_value;
    	let input_step_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "id", "value-input");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "min", input_min_value = /*data*/ ctx[0].min);
    			attr_dev(input, "max", input_max_value = /*data*/ ctx[0].max);
    			attr_dev(input, "step", input_step_value = /*data*/ ctx[0].step);
    			attr_dev(input, "class", "svelte-fbb8yg");
    			add_location(input, file$4, 64, 12, 1797);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*data*/ ctx[0].value);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_1*/ ctx[11]),
    					listen_dev(input, "input", /*onValueChange*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && input_min_value !== (input_min_value = /*data*/ ctx[0].min)) {
    				attr_dev(input, "min", input_min_value);
    			}

    			if (dirty & /*data*/ 1 && input_max_value !== (input_max_value = /*data*/ ctx[0].max)) {
    				attr_dev(input, "max", input_max_value);
    			}

    			if (dirty & /*data*/ 1 && input_step_value !== (input_step_value = /*data*/ ctx[0].step)) {
    				attr_dev(input, "step", input_step_value);
    			}

    			if (dirty & /*data*/ 1 && to_number(input.value) !== /*data*/ ctx[0].value) {
    				set_input_value(input, /*data*/ ctx[0].value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(64:8) {#if data.type === \\\"float\\\"}",
    		ctx
    	});

    	return block;
    }

    // (92:8) {#if data.type === "float"}
    function create_if_block_2$1(ctx) {
    	let div;
    	let span0;
    	let t0_value = /*data*/ ctx[0].min + "";
    	let t0;
    	let t1;
    	let input;
    	let input_min_value;
    	let input_max_value;
    	let input_step_value;
    	let t2;
    	let span1;
    	let t3_value = /*data*/ ctx[0].max + "";
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			add_location(span0, file$4, 93, 16, 3207);
    			attr_dev(input, "id", "slider");
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", input_min_value = /*data*/ ctx[0].min);
    			attr_dev(input, "max", input_max_value = /*data*/ ctx[0].max);
    			attr_dev(input, "step", input_step_value = /*data*/ ctx[0].step);
    			attr_dev(input, "class", "svelte-fbb8yg");
    			add_location(input, file$4, 94, 16, 3247);
    			add_location(span1, file$4, 96, 16, 3414);
    			attr_dev(div, "id", "row2");
    			attr_dev(div, "class", "svelte-fbb8yg");
    			add_location(div, file$4, 92, 12, 3175);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, t1);
    			append_dev(div, input);
    			set_input_value(input, /*data*/ ctx[0].value);
    			append_dev(div, t2);
    			append_dev(div, span1);
    			append_dev(span1, t3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[19]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[19]),
    					listen_dev(input, "input", /*onValueChange*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*data*/ ctx[0].min + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*data*/ 1 && input_min_value !== (input_min_value = /*data*/ ctx[0].min)) {
    				attr_dev(input, "min", input_min_value);
    			}

    			if (dirty & /*data*/ 1 && input_max_value !== (input_max_value = /*data*/ ctx[0].max)) {
    				attr_dev(input, "max", input_max_value);
    			}

    			if (dirty & /*data*/ 1 && input_step_value !== (input_step_value = /*data*/ ctx[0].step)) {
    				attr_dev(input, "step", input_step_value);
    			}

    			if (dirty & /*data*/ 1) {
    				set_input_value(input, /*data*/ ctx[0].value);
    			}

    			if (dirty & /*data*/ 1 && t3_value !== (t3_value = /*data*/ ctx[0].max + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(92:8) {#if data.type === \\\"float\\\"}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#if showEditUI}
    function create_if_block$2(ctx) {
    	let div;

    	function select_block_type_2(ctx, dirty) {
    		if (/*data*/ ctx[0].type === "float") return create_if_block_1$2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "id", "edit-ui");
    			attr_dev(div, "class", "svelte-fbb8yg");
    			add_location(div, file$4, 81, 8, 2680);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(81:4) {#if showEditUI}",
    		ctx
    	});

    	return block;
    }

    // (87:12) {:else}
    function create_else_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Reset";
    			attr_dev(button, "id", "reset-point-btn");
    			attr_dev(button, "class", "svelte-fbb8yg");
    			add_location(button, file$4, 87, 16, 3016);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*resetPoint*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(87:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (83:12) {#if data.type === "float"}
    function create_if_block_1$2(ctx) {
    	let span0;
    	let input0;
    	let t1;
    	let span1;
    	let input1;
    	let t3;
    	let span2;
    	let input2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			span0.textContent = "Min: ";
    			input0 = element("input");
    			t1 = space();
    			span1 = element("span");
    			span1.textContent = "Max: ";
    			input1 = element("input");
    			t3 = space();
    			span2 = element("span");
    			span2.textContent = "Step: ";
    			input2 = element("input");
    			add_location(span0, file$4, 83, 16, 2755);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "class", "svelte-fbb8yg");
    			add_location(input0, file$4, 83, 34, 2773);
    			add_location(span1, file$4, 84, 16, 2835);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "class", "svelte-fbb8yg");
    			add_location(input1, file$4, 84, 34, 2853);
    			add_location(span2, file$4, 85, 16, 2915);
    			attr_dev(input2, "type", "number");
    			attr_dev(input2, "class", "svelte-fbb8yg");
    			add_location(input2, file$4, 85, 35, 2934);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*data*/ ctx[0].min);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*data*/ ctx[0].max);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span2, anchor);
    			insert_dev(target, input2, anchor);
    			set_input_value(input2, /*data*/ ctx[0].step);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[16]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[17]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[18])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && to_number(input0.value) !== /*data*/ ctx[0].min) {
    				set_input_value(input0, /*data*/ ctx[0].min);
    			}

    			if (dirty & /*data*/ 1 && to_number(input1.value) !== /*data*/ ctx[0].max) {
    				set_input_value(input1, /*data*/ ctx[0].max);
    			}

    			if (dirty & /*data*/ 1 && to_number(input2.value) !== /*data*/ ctx[0].step) {
    				set_input_value(input2, /*data*/ ctx[0].step);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(input2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(83:12) {#if data.type === \\\"float\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let resizableinput;
    	let updating_value;
    	let t1;
    	let span;
    	let t3;
    	let current_block_type_index;
    	let if_block1;
    	let t4;
    	let button0;
    	let i0;
    	let t5;
    	let button1;
    	let i1;
    	let t6;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*data*/ ctx[0].type === "vec2" && create_if_block_5(ctx);

    	function resizableinput_value_binding(value) {
    		/*resizableinput_value_binding*/ ctx[10](value);
    	}

    	let resizableinput_props = { type: "text" };

    	if (/*data*/ ctx[0].name !== void 0) {
    		resizableinput_props.value = /*data*/ ctx[0].name;
    	}

    	resizableinput = new ResizableInput({
    			props: resizableinput_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(resizableinput, 'value', resizableinput_value_binding));
    	resizableinput.$on("input", /*onNameChange*/ ctx[6]);
    	const if_block_creators = [create_if_block_3$1, create_if_block_4$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[0].type === "float") return 0;
    		if (/*data*/ ctx[0].type === "vec2") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*showEditUI*/ ctx[1]) return create_if_block$2;
    		if (/*data*/ ctx[0].type === "float") return create_if_block_2$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block2 = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			create_component(resizableinput.$$.fragment);
    			t1 = space();
    			span = element("span");
    			span.textContent = "=";
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			button0 = element("button");
    			i0 = element("i");
    			t5 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t6 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(span, "class", "non-clickable svelte-fbb8yg");
    			add_location(span, file$4, 61, 8, 1711);
    			attr_dev(i0, "class", "bi bi-gear svelte-fbb8yg");
    			toggle_class(i0, "active", /*showEditUI*/ ctx[1]);
    			add_location(i0, file$4, 74, 12, 2449);
    			attr_dev(button0, "id", "settings-btn");
    			attr_dev(button0, "class", "svelte-fbb8yg");
    			add_location(button0, file$4, 73, 8, 2368);
    			attr_dev(i1, "class", "bi bi-x-circle svelte-fbb8yg");
    			add_location(i1, file$4, 77, 12, 2591);
    			attr_dev(button1, "class", "svelte-fbb8yg");
    			add_location(button1, file$4, 76, 8, 2528);
    			attr_dev(div0, "id", "row1");
    			attr_dev(div0, "class", "svelte-fbb8yg");
    			add_location(div0, file$4, 51, 4, 1366);
    			attr_dev(div1, "id", "container");
    			attr_dev(div1, "class", "svelte-fbb8yg");
    			add_location(div1, file$4, 50, 0, 1274);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			mount_component(resizableinput, div0, null);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(div0, t3);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div0, null);
    			}

    			append_dev(div0, t4);
    			append_dev(div0, button0);
    			append_dev(button0, i0);
    			append_dev(div0, t5);
    			append_dev(div0, button1);
    			append_dev(button1, i1);
    			append_dev(div1, t6);
    			if (if_block2) if_block2.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[14], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[15], false, false, false),
    					listen_dev(div1, "keydown", /*keydown_handler*/ ctx[20], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*data*/ ctx[0].type === "vec2") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					if_block0.m(div0, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			const resizableinput_changes = {};

    			if (!updating_value && dirty & /*data*/ 1) {
    				updating_value = true;
    				resizableinput_changes.value = /*data*/ ctx[0].name;
    				add_flush_callback(() => updating_value = false);
    			}

    			resizableinput.$set(resizableinput_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(div0, t4);
    				} else {
    					if_block1 = null;
    				}
    			}

    			if (!current || dirty & /*showEditUI*/ 2) {
    				toggle_class(i0, "active", /*showEditUI*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if (if_block2) if_block2.d(1);
    				if_block2 = current_block_type && current_block_type(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div1, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(resizableinput.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(resizableinput.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			destroy_component(resizableinput);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (if_block2) {
    				if_block2.d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Variable', slots, []);
    	let { data } = $$props;
    	let dispatch = createEventDispatcher();
    	let showEditUI = false;
    	let prevName = data.name;
    	let displayX, displayY;

    	function resetPoint() {
    		if (data.type === "vec2") {
    			$$invalidate(0, data.x = 0, data);
    			$$invalidate(0, data.y = 0, data);
    		}

    		onValueChange();
    		$$invalidate(1, showEditUI = false);
    	}

    	function onNameChange() {
    		dispatch("nameChange", { prevName, data });
    		prevName = data.name;
    	}

    	function onPointValueChange(xory, e) {
    		if (data.type !== "vec2") return; //typescript
    		if (xory === "x") $$invalidate(0, data.x = e.target.value, data);
    		if (xory === "y") $$invalidate(0, data.y = e.target.value, data);
    		onValueChange();
    	}

    	function onValueChange() {
    		console.log("value change", data);
    		dispatch("valueChange", data);
    		updateMinMax();
    	}

    	function updateMinMax() {
    		if (data.type === "float") {
    			$$invalidate(0, data.min = Math.min(data.min, data.value), data);
    			$$invalidate(0, data.max = Math.max(data.max, data.value), data);
    		}
    	}

    	$$self.$$.on_mount.push(function () {
    		if (data === undefined && !('data' in $$props || $$self.$$.bound[$$self.$$.props['data']])) {
    			console_1$3.warn("<Variable> was created without expected prop 'data'");
    		}
    	});

    	const writable_props = ['data'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Variable> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		data.color = this.value;
    		$$invalidate(0, data);
    	}

    	function resizableinput_value_binding(value) {
    		if ($$self.$$.not_equal(data.name, value)) {
    			data.name = value;
    			$$invalidate(0, data);
    		}
    	}

    	function input_input_handler_1() {
    		data.value = to_number(this.value);
    		$$invalidate(0, data);
    	}

    	const input_handler = e => onPointValueChange('x', e);
    	const input_handler_1 = e => onPointValueChange('y', e);
    	const click_handler = () => $$invalidate(1, showEditUI = !showEditUI);
    	const click_handler_1 = () => dispatch("delete", data);

    	function input0_input_handler() {
    		data.min = to_number(this.value);
    		$$invalidate(0, data);
    	}

    	function input1_input_handler() {
    		data.max = to_number(this.value);
    		$$invalidate(0, data);
    	}

    	function input2_input_handler() {
    		data.step = to_number(this.value);
    		$$invalidate(0, data);
    	}

    	function input_change_input_handler() {
    		data.value = to_number(this.value);
    		$$invalidate(0, data);
    	}

    	const keydown_handler = e => {
    		if (e.key === "Enter") $$invalidate(1, showEditUI = false);
    	};

    	$$self.$$set = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		ResizableInput,
    		roundToDigits,
    		data,
    		dispatch,
    		showEditUI,
    		prevName,
    		displayX,
    		displayY,
    		resetPoint,
    		onNameChange,
    		onPointValueChange,
    		onValueChange,
    		updateMinMax
    	});

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('dispatch' in $$props) $$invalidate(4, dispatch = $$props.dispatch);
    		if ('showEditUI' in $$props) $$invalidate(1, showEditUI = $$props.showEditUI);
    		if ('prevName' in $$props) prevName = $$props.prevName;
    		if ('displayX' in $$props) $$invalidate(2, displayX = $$props.displayX);
    		if ('displayY' in $$props) $$invalidate(3, displayY = $$props.displayY);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*data*/ 1) {
    			{
    				if (data.type === "vec2") {
    					$$invalidate(2, displayX = roundToDigits(data.x, 3));
    					$$invalidate(3, displayY = roundToDigits(data.y, 3));
    				}
    			}
    		}
    	};

    	return [
    		data,
    		showEditUI,
    		displayX,
    		displayY,
    		dispatch,
    		resetPoint,
    		onNameChange,
    		onPointValueChange,
    		onValueChange,
    		input_input_handler,
    		resizableinput_value_binding,
    		input_input_handler_1,
    		input_handler,
    		input_handler_1,
    		click_handler,
    		click_handler_1,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input_change_input_handler,
    		keydown_handler
    	];
    }

    class Variable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Variable",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get data() {
    		throw new Error("<Variable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Variable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Controls.svelte generated by Svelte v3.55.1 */

    const { console: console_1$2 } = globals;
    const file$3 = "src/components/Controls.svelte";

    // (14:0) {#key settings}
    function create_key_block$1(ctx) {
    	let div6;
    	let div0;
    	let span0;
    	let t1;
    	let input0;
    	let input0_checked_value;
    	let t2;
    	let div1;
    	let span1;
    	let t4;
    	let input1;
    	let input1_value_value;
    	let t5;
    	let div2;
    	let span2;
    	let t7;
    	let input2;
    	let input2_checked_value;
    	let t8;
    	let div3;
    	let span3;
    	let t10;
    	let input3;
    	let input3_checked_value;
    	let t11;
    	let div4;
    	let span4;
    	let t13;
    	let input4;
    	let input4_checked_value;
    	let t14;
    	let div5;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Grid on:";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "Grid spacing:";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			div2 = element("div");
    			span2 = element("span");
    			span2.textContent = "Mod contours:";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			div3 = element("div");
    			span3 = element("span");
    			span3.textContent = "Phase contours:";
    			t10 = space();
    			input3 = element("input");
    			t11 = space();
    			div4 = element("div");
    			span4 = element("span");
    			span4.textContent = "Polar form:";
    			t13 = space();
    			input4 = element("input");
    			t14 = space();
    			div5 = element("div");
    			button = element("button");
    			button.textContent = "Reset camera (h)";
    			attr_dev(span0, "class", "label svelte-1jasimh");
    			add_location(span0, file$3, 16, 8, 425);
    			attr_dev(input0, "type", "checkbox");
    			input0.checked = input0_checked_value = /*canvas*/ ctx[0].getSetting('showGrid');
    			attr_dev(input0, "class", "svelte-1jasimh");
    			add_location(input0, file$3, 17, 8, 470);
    			attr_dev(div0, "class", "setting svelte-1jasimh");
    			add_location(div0, file$3, 15, 4, 395);
    			attr_dev(span1, "class", "label svelte-1jasimh");
    			add_location(span1, file$3, 21, 8, 660);
    			attr_dev(input1, "type", "range");
    			attr_dev(input1, "min", "0.05");
    			attr_dev(input1, "max", "2.0");
    			attr_dev(input1, "step", "0.001");
    			input1.value = input1_value_value = /*canvas*/ ctx[0].getSetting('gridSpacing');
    			attr_dev(input1, "class", "svelte-1jasimh");
    			add_location(input1, file$3, 22, 8, 710);
    			attr_dev(div1, "class", "setting svelte-1jasimh");
    			add_location(div1, file$3, 20, 4, 630);
    			attr_dev(span2, "class", "label svelte-1jasimh");
    			add_location(span2, file$3, 26, 8, 932);
    			attr_dev(input2, "type", "checkbox");
    			input2.checked = input2_checked_value = /*canvas*/ ctx[0].getSetting('showModContours');
    			attr_dev(input2, "class", "svelte-1jasimh");
    			add_location(input2, file$3, 27, 8, 982);
    			attr_dev(div2, "class", "setting svelte-1jasimh");
    			add_location(div2, file$3, 25, 4, 902);
    			attr_dev(span3, "class", "label svelte-1jasimh");
    			add_location(span3, file$3, 31, 8, 1186);
    			attr_dev(input3, "type", "checkbox");
    			input3.checked = input3_checked_value = /*canvas*/ ctx[0].getSetting('showPhaseContours');
    			attr_dev(input3, "class", "svelte-1jasimh");
    			add_location(input3, file$3, 32, 8, 1238);
    			attr_dev(div3, "class", "setting svelte-1jasimh");
    			add_location(div3, file$3, 30, 4, 1156);
    			attr_dev(span4, "class", "label svelte-1jasimh");
    			add_location(span4, file$3, 36, 8, 1450);
    			attr_dev(input4, "type", "checkbox");
    			input4.checked = input4_checked_value = /*canvas*/ ctx[0].getSetting('polarCoords');
    			attr_dev(input4, "class", "svelte-1jasimh");
    			add_location(input4, file$3, 37, 8, 1498);
    			attr_dev(div4, "class", "setting svelte-1jasimh");
    			add_location(div4, file$3, 35, 4, 1420);
    			attr_dev(button, "class", "svelte-1jasimh");
    			add_location(button, file$3, 41, 8, 1695);
    			attr_dev(div5, "id", "buttons");
    			attr_dev(div5, "class", "svelte-1jasimh");
    			add_location(div5, file$3, 40, 4, 1668);
    			attr_dev(div6, "id", "container");
    			attr_dev(div6, "class", "svelte-1jasimh");
    			add_location(div6, file$3, 14, 0, 370);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			append_dev(div6, t2);
    			append_dev(div6, div1);
    			append_dev(div1, span1);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			append_dev(div6, t5);
    			append_dev(div6, div2);
    			append_dev(div2, span2);
    			append_dev(div2, t7);
    			append_dev(div2, input2);
    			append_dev(div6, t8);
    			append_dev(div6, div3);
    			append_dev(div3, span3);
    			append_dev(div3, t10);
    			append_dev(div3, input3);
    			append_dev(div6, t11);
    			append_dev(div6, div4);
    			append_dev(div4, span4);
    			append_dev(div4, t13);
    			append_dev(div4, input4);
    			append_dev(div6, t14);
    			append_dev(div6, div5);
    			append_dev(div5, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[2], false, false, false),
    					listen_dev(input1, "input", /*input_handler*/ ctx[3], false, false, false),
    					listen_dev(input2, "change", /*change_handler_1*/ ctx[4], false, false, false),
    					listen_dev(input3, "change", /*change_handler_2*/ ctx[5], false, false, false),
    					listen_dev(input4, "change", /*change_handler_3*/ ctx[6], false, false, false),
    					listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*canvas*/ 1 && input0_checked_value !== (input0_checked_value = /*canvas*/ ctx[0].getSetting('showGrid'))) {
    				prop_dev(input0, "checked", input0_checked_value);
    			}

    			if (dirty & /*canvas*/ 1 && input1_value_value !== (input1_value_value = /*canvas*/ ctx[0].getSetting('gridSpacing'))) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*canvas*/ 1 && input2_checked_value !== (input2_checked_value = /*canvas*/ ctx[0].getSetting('showModContours'))) {
    				prop_dev(input2, "checked", input2_checked_value);
    			}

    			if (dirty & /*canvas*/ 1 && input3_checked_value !== (input3_checked_value = /*canvas*/ ctx[0].getSetting('showPhaseContours'))) {
    				prop_dev(input3, "checked", input3_checked_value);
    			}

    			if (dirty & /*canvas*/ 1 && input4_checked_value !== (input4_checked_value = /*canvas*/ ctx[0].getSetting('polarCoords'))) {
    				prop_dev(input4, "checked", input4_checked_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block$1.name,
    		type: "key",
    		source: "(14:0) {#key settings}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let previous_key = /*settings*/ ctx[1];
    	let key_block_anchor;
    	let key_block = create_key_block$1(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*settings*/ 2 && safe_not_equal(previous_key, previous_key = /*settings*/ ctx[1])) {
    				key_block.d(1);
    				key_block = create_key_block$1(ctx);
    				key_block.c();
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Controls', slots, []);
    	let { canvas } = $$props;
    	let settings = canvas.settings;

    	function getSettingValue(name) {
    		if (!canvas.settings.has(name)) console.error(`Setting ${name} not found`);
    		return canvas.settings.get(name).value;
    	}

    	function resetSettings() {
    		$$invalidate(0, canvas.settings = canvas.defaultSettings, canvas);
    		$$invalidate(1, settings = canvas.settings);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (canvas === undefined && !('canvas' in $$props || $$self.$$.bound[$$self.$$.props['canvas']])) {
    			console_1$2.warn("<Controls> was created without expected prop 'canvas'");
    		}
    	});

    	const writable_props = ['canvas'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Controls> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => canvas.updateSetting('showGrid', e.target.checked);
    	const input_handler = e => canvas.updateSetting('gridSpacing', e.target.value);
    	const change_handler_1 = e => canvas.updateSetting('showModContours', e.target.checked);
    	const change_handler_2 = e => canvas.updateSetting('showPhaseContours', e.target.checked);
    	const change_handler_3 = e => canvas.updateSetting('polarCoords', e.target.checked);
    	const click_handler = () => canvas.camera.reset();

    	$$self.$$set = $$props => {
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    	};

    	$$self.$capture_state = () => ({
    		canvas,
    		settings,
    		getSettingValue,
    		resetSettings
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ('settings' in $$props) $$invalidate(1, settings = $$props.settings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		canvas,
    		settings,
    		change_handler,
    		input_handler,
    		change_handler_1,
    		change_handler_2,
    		change_handler_3,
    		click_handler
    	];
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { canvas: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controls",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get canvas() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canvas(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Sidebar.svelte generated by Svelte v3.55.1 */

    const { console: console_1$1 } = globals;
    const file$2 = "src/components/Sidebar.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    // (109:36) 
    function create_if_block_1$1(ctx) {
    	let div;
    	let controls;
    	let div_transition;
    	let current;

    	controls = new Controls({
    			props: { canvas: /*canvas*/ ctx[2] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(controls.$$.fragment);
    			attr_dev(div, "id", "controls-tab");
    			attr_dev(div, "class", "svelte-1tnafci");
    			add_location(div, file$2, 109, 8, 3930);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(controls, div, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const controls_changes = {};
    			if (dirty & /*canvas*/ 4) controls_changes.canvas = /*canvas*/ ctx[2];
    			controls.$set(controls_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(controls.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					fly,
    					{
    						x: -100,
    						duration: /*tabTransitionDuration*/ ctx[6]
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(controls.$$.fragment, local);

    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				fly,
    				{
    					x: -100,
    					duration: /*tabTransitionDuration*/ ctx[6]
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(controls);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(109:36) ",
    		ctx
    	});

    	return block;
    }

    // (79:8) {#if activeTab.id == 1}
    function create_if_block$1(ctx) {
    	let div3;
    	let div2;
    	let editor;
    	let updating_code;
    	let t0;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t1;
    	let div1;
    	let button0;
    	let i0;
    	let t2;
    	let t3;
    	let button1;
    	let i1;
    	let t4;
    	let div3_intro;
    	let div3_outro;
    	let current;
    	let mounted;
    	let dispose;

    	function editor_code_binding(value) {
    		/*editor_code_binding*/ ctx[14](value);
    	}

    	let editor_props = { canvas: /*canvas*/ ctx[2] };

    	if (/*editorText*/ ctx[1] !== void 0) {
    		editor_props.code = /*editorText*/ ctx[1];
    	}

    	editor = new Editor({ props: editor_props, $$inline: true });
    	binding_callbacks.push(() => bind(editor, 'code', editor_code_binding));
    	let each_value = /*$uvars*/ ctx[4];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*v*/ ctx[22].id;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			create_component(editor.$$.fragment);
    			t0 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			button0 = element("button");
    			i0 = element("i");
    			t2 = text("Add slider");
    			t3 = space();
    			button1 = element("button");
    			i1 = element("i");
    			t4 = text("Add point");
    			attr_dev(div0, "id", "variables-area");
    			add_location(div0, file$2, 87, 16, 3015);
    			attr_dev(i0, "class", "bi bi-plus svelte-1tnafci");
    			add_location(i0, file$2, 99, 24, 3589);
    			attr_dev(button0, "class", "add-slider-btn svelte-1tnafci");
    			add_location(button0, file$2, 98, 20, 3503);
    			attr_dev(i1, "class", "bi bi-plus svelte-1tnafci");
    			add_location(i1, file$2, 102, 24, 3761);
    			attr_dev(button1, "class", "add-slider-btn svelte-1tnafci");
    			add_location(button1, file$2, 101, 20, 3676);
    			attr_dev(div1, "id", "buttons");
    			attr_dev(div1, "class", "svelte-1tnafci");
    			add_location(div1, file$2, 97, 16, 3464);
    			attr_dev(div2, "id", "main-tab-inner");
    			attr_dev(div2, "class", "svelte-1tnafci");
    			add_location(div2, file$2, 84, 12, 2891);
    			attr_dev(div3, "id", "main-tab");
    			attr_dev(div3, "class", "svelte-1tnafci");
    			add_location(div3, file$2, 79, 8, 2687);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			mount_component(editor, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, i0);
    			append_dev(button0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			append_dev(button1, i1);
    			append_dev(button1, t4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[18], false, false, false),
    					listen_dev(button1, "click", /*click_handler_2*/ ctx[19], false, false, false),
    					listen_dev(div3, "outrostart", makeAbsolute, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const editor_changes = {};
    			if (dirty & /*canvas*/ 4) editor_changes.canvas = /*canvas*/ ctx[2];

    			if (!updating_code && dirty & /*editorText*/ 2) {
    				updating_code = true;
    				editor_changes.code = /*editorText*/ ctx[1];
    				add_flush_callback(() => updating_code = false);
    			}

    			editor.$set(editor_changes);

    			if (dirty & /*$uvars, deleteVariable, variableNameChange, variableValueChange*/ 3600) {
    				each_value = /*$uvars*/ ctx[4];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(editor.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (div3_outro) div3_outro.end(1);

    				div3_intro = create_in_transition(div3, fly, {
    					x: -10,
    					duration: /*tabTransitionDuration*/ ctx[6]
    				});

    				div3_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(editor.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (div3_intro) div3_intro.invalidate();

    			div3_outro = create_out_transition(div3, fly, {
    				x: 10,
    				duration: /*tabTransitionDuration*/ ctx[6]
    			});

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(editor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching && div3_outro) div3_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(79:8) {#if activeTab.id == 1}",
    		ctx
    	});

    	return block;
    }

    // (89:20) {#each $uvars as v (v.id)}
    function create_each_block$1(key_1, ctx) {
    	let first;
    	let variable;
    	let current;

    	variable = new Variable({
    			props: { data: /*v*/ ctx[22] },
    			$$inline: true
    		});

    	variable.$on("delete", /*delete_handler*/ ctx[15]);
    	variable.$on("nameChange", /*nameChange_handler*/ ctx[16]);
    	variable.$on("valueChange", /*valueChange_handler*/ ctx[17]);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(variable.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(variable, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const variable_changes = {};
    			if (dirty & /*$uvars*/ 16) variable_changes.data = /*v*/ ctx[22];
    			variable.$set(variable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(variable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(variable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(variable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(89:20) {#each $uvars as v (v.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let navbar;
    	let updating_activeTab;
    	let t0;
    	let button;
    	let i;
    	let i_class_value;
    	let t1;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;

    	function navbar_activeTab_binding(value) {
    		/*navbar_activeTab_binding*/ ctx[12](value);
    	}

    	let navbar_props = { tabs: /*tabs*/ ctx[5] };

    	if (/*activeTab*/ ctx[3] !== void 0) {
    		navbar_props.activeTab = /*activeTab*/ ctx[3];
    	}

    	navbar = new Navbar({ props: navbar_props, $$inline: true });
    	binding_callbacks.push(() => bind(navbar, 'activeTab', navbar_activeTab_binding));
    	const if_block_creators = [create_if_block$1, create_if_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*activeTab*/ ctx[3].id == 1) return 0;
    		if (/*activeTab*/ ctx[3].id == 2) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			button = element("button");
    			i = element("i");
    			t1 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(i, "class", i_class_value = "bi bi-chevron-double-" + (/*collapsed*/ ctx[0] ? 'right' : 'left') + " svelte-1tnafci");
    			add_location(i, file$2, 73, 12, 2514);
    			attr_dev(button, "id", "btn-collapse");
    			attr_dev(button, "class", "svelte-1tnafci");
    			add_location(button, file$2, 71, 8, 2422);
    			attr_dev(div0, "id", "tab-area");
    			add_location(div0, file$2, 68, 4, 2332);
    			attr_dev(div1, "id", "below-tab-area");
    			attr_dev(div1, "class", "svelte-1tnafci");
    			add_location(div1, file$2, 77, 4, 2621);
    			attr_dev(div2, "id", "sidebar");
    			attr_dev(div2, "class", "svelte-1tnafci");
    			add_location(div2, file$2, 67, 0, 2309);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(navbar, div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(button, i);
    			append_dev(div2, t1);
    			append_dev(div2, div1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const navbar_changes = {};

    			if (!updating_activeTab && dirty & /*activeTab*/ 8) {
    				updating_activeTab = true;
    				navbar_changes.activeTab = /*activeTab*/ ctx[3];
    				add_flush_callback(() => updating_activeTab = false);
    			}

    			navbar.$set(navbar_changes);

    			if (!current || dirty & /*collapsed*/ 1 && i_class_value !== (i_class_value = "bi bi-chevron-double-" + (/*collapsed*/ ctx[0] ? 'right' : 'left') + " svelte-1tnafci")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(navbar);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $uvars;
    	validate_store(uvars, 'uvars');
    	component_subscribe($$self, uvars, $$value => $$invalidate(4, $uvars = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sidebar', slots, []);
    	let { canvas } = $$props;
    	let { collapsed = false } = $$props;
    	let { editorText = "" } = $$props;
    	let dispatch = createEventDispatcher();
    	let tabs = [{ name: "Main", id: 1 }, { name: "Settings", id: 2 }];
    	let activeTab = tabs[0];
    	let tabTransitionDuration = 150;

    	function duplicateName(v) {
    		return $uvars.some(w => w.id !== v.id && w.name === v.name);
    	}

    	function addSlider(name = "", value = 0, min = -10, max = 10, step = 0.001) {
    		set_store_value(
    			uvars,
    			$uvars = [
    				...$uvars,
    				{
    					id: v4(),
    					type: "float",
    					name,
    					value,
    					min,
    					max,
    					step
    				}
    			],
    			$uvars
    		);

    		if (name.trim()) canvas.addUniform(name, value, "float");
    	}

    	function addPoint(name = "", x = 0, y = 0, color = randomColorRGB()) {
    		set_store_value(
    			uvars,
    			$uvars = [
    				...$uvars,
    				{
    					id: v4(),
    					type: "vec2",
    					name,
    					x,
    					y,
    					color
    				}
    			],
    			$uvars
    		);

    		if (name.trim()) canvas.addUniform(name, [x, y], "vec2");
    	}

    	function deleteVariable(v) {
    		set_store_value(uvars, $uvars = $uvars.filter(uvar => uvar.id !== v.id), $uvars);

    		if (!duplicateName(v)) {
    			canvas.deleteUniform(v.name);
    			canvas.compileUserCodeToGlsl(editorText, true);
    		}
    	}

    	function variableValueChange(v) {
    		uvars.set($uvars);
    		console.log("value change", $uvars);
    		dispatch("variableChange", v);
    		if (!v.name.trim()) return;
    		canvas.setUniformValue(v.name, v.type === "float" ? v.value : [v.x, v.y]);
    		canvas.render();
    	}

    	function variableNameChange(info) {
    		uvars.set($uvars);
    		let [prevName, v] = [info.prevName, info.data];

    		if (prevName.trim() && !$uvars.some(s => s.name === prevName && s.id !== v.id)) {
    			canvas.deleteUniform(prevName);
    		}

    		if (duplicateName(v)) {
    			console.error("Duplicate name ", v.name);
    		} else if (v.name.trim()) {
    			if (v.type === "float") canvas.addUniform(v.name, v.value, "float"); else if (v.type === "vec2") canvas.addUniform(v.name, [v.x, v.y], "vec2");
    		}

    		canvas.compileUserCodeToGlsl(editorText, true);
    	}

    	$$self.$$.on_mount.push(function () {
    		if (canvas === undefined && !('canvas' in $$props || $$self.$$.bound[$$self.$$.props['canvas']])) {
    			console_1$1.warn("<Sidebar> was created without expected prop 'canvas'");
    		}
    	});

    	const writable_props = ['canvas', 'collapsed', 'editorText'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	function navbar_activeTab_binding(value) {
    		activeTab = value;
    		$$invalidate(3, activeTab);
    	}

    	const click_handler = () => $$invalidate(0, collapsed = !collapsed);

    	function editor_code_binding(value) {
    		editorText = value;
    		$$invalidate(1, editorText);
    	}

    	const delete_handler = e => deleteVariable(e.detail);
    	const nameChange_handler = e => variableNameChange(e.detail);
    	const valueChange_handler = e => variableValueChange(e.detail);
    	const click_handler_1 = e => addSlider();
    	const click_handler_2 = e => addPoint();

    	$$self.$$set = $$props => {
    		if ('canvas' in $$props) $$invalidate(2, canvas = $$props.canvas);
    		if ('collapsed' in $$props) $$invalidate(0, collapsed = $$props.collapsed);
    		if ('editorText' in $$props) $$invalidate(1, editorText = $$props.editorText);
    	};

    	$$self.$capture_state = () => ({
    		makeAbsolute,
    		randomColorRGB,
    		Navbar,
    		Editor,
    		Variable,
    		Controls,
    		uvars,
    		fly,
    		uuidv4: v4,
    		createEventDispatcher,
    		canvas,
    		collapsed,
    		editorText,
    		dispatch,
    		tabs,
    		activeTab,
    		tabTransitionDuration,
    		duplicateName,
    		addSlider,
    		addPoint,
    		deleteVariable,
    		variableValueChange,
    		variableNameChange,
    		$uvars
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvas' in $$props) $$invalidate(2, canvas = $$props.canvas);
    		if ('collapsed' in $$props) $$invalidate(0, collapsed = $$props.collapsed);
    		if ('editorText' in $$props) $$invalidate(1, editorText = $$props.editorText);
    		if ('dispatch' in $$props) dispatch = $$props.dispatch;
    		if ('tabs' in $$props) $$invalidate(5, tabs = $$props.tabs);
    		if ('activeTab' in $$props) $$invalidate(3, activeTab = $$props.activeTab);
    		if ('tabTransitionDuration' in $$props) $$invalidate(6, tabTransitionDuration = $$props.tabTransitionDuration);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		collapsed,
    		editorText,
    		canvas,
    		activeTab,
    		$uvars,
    		tabs,
    		tabTransitionDuration,
    		addSlider,
    		addPoint,
    		deleteVariable,
    		variableValueChange,
    		variableNameChange,
    		navbar_activeTab_binding,
    		click_handler,
    		editor_code_binding,
    		delete_handler,
    		nameChange_handler,
    		valueChange_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { canvas: 2, collapsed: 0, editorText: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get canvas() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canvas(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get collapsed() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set collapsed(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get editorText() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set editorText(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // The programming goals of Split.js are to deliver readable, understandable and
    // maintainable code, while at the same time manually optimizing for tiny minified file size,
    // browser compatibility without additional requirements
    // and very few assumptions about the user's page layout.
    var global$1 = typeof window !== 'undefined' ? window : null;
    var ssr = global$1 === null;
    var document$1 = !ssr ? global$1.document : undefined;

    // Save a couple long function names that are used frequently.
    // This optimization saves around 400 bytes.
    var addEventListener = 'addEventListener';
    var removeEventListener = 'removeEventListener';
    var getBoundingClientRect = 'getBoundingClientRect';
    var gutterStartDragging = '_a';
    var aGutterSize = '_b';
    var bGutterSize = '_c';
    var HORIZONTAL = 'horizontal';
    var NOOP = function () { return false; };

    // Helper function determines which prefixes of CSS calc we need.
    // We only need to do this once on startup, when this anonymous function is called.
    //
    // Tests -webkit, -moz and -o prefixes. Modified from StackOverflow:
    // http://stackoverflow.com/questions/16625140/js-feature-detection-to-detect-the-usage-of-webkit-calc-over-calc/16625167#16625167
    var calc = ssr
        ? 'calc'
        : ((['', '-webkit-', '-moz-', '-o-']
              .filter(function (prefix) {
                  var el = document$1.createElement('div');
                  el.style.cssText = "width:" + prefix + "calc(9px)";

                  return !!el.style.length
              })
              .shift()) + "calc");

    // Helper function checks if its argument is a string-like type
    var isString = function (v) { return typeof v === 'string' || v instanceof String; };

    // Helper function allows elements and string selectors to be used
    // interchangeably. In either case an element is returned. This allows us to
    // do `Split([elem1, elem2])` as well as `Split(['#id1', '#id2'])`.
    var elementOrSelector = function (el) {
        if (isString(el)) {
            var ele = document$1.querySelector(el);
            if (!ele) {
                throw new Error(("Selector " + el + " did not match a DOM element"))
            }
            return ele
        }

        return el
    };

    // Helper function gets a property from the properties object, with a default fallback
    var getOption = function (options, propName, def) {
        var value = options[propName];
        if (value !== undefined) {
            return value
        }
        return def
    };

    var getGutterSize = function (gutterSize, isFirst, isLast, gutterAlign) {
        if (isFirst) {
            if (gutterAlign === 'end') {
                return 0
            }
            if (gutterAlign === 'center') {
                return gutterSize / 2
            }
        } else if (isLast) {
            if (gutterAlign === 'start') {
                return 0
            }
            if (gutterAlign === 'center') {
                return gutterSize / 2
            }
        }

        return gutterSize
    };

    // Default options
    var defaultGutterFn = function (i, gutterDirection) {
        var gut = document$1.createElement('div');
        gut.className = "gutter gutter-" + gutterDirection;
        return gut
    };

    var defaultElementStyleFn = function (dim, size, gutSize) {
        var style = {};

        if (!isString(size)) {
            style[dim] = calc + "(" + size + "% - " + gutSize + "px)";
        } else {
            style[dim] = size;
        }

        return style
    };

    var defaultGutterStyleFn = function (dim, gutSize) {
        var obj;

        return (( obj = {}, obj[dim] = (gutSize + "px"), obj ));
    };

    // The main function to initialize a split. Split.js thinks about each pair
    // of elements as an independant pair. Dragging the gutter between two elements
    // only changes the dimensions of elements in that pair. This is key to understanding
    // how the following functions operate, since each function is bound to a pair.
    //
    // A pair object is shaped like this:
    //
    // {
    //     a: DOM element,
    //     b: DOM element,
    //     aMin: Number,
    //     bMin: Number,
    //     dragging: Boolean,
    //     parent: DOM element,
    //     direction: 'horizontal' | 'vertical'
    // }
    //
    // The basic sequence:
    //
    // 1. Set defaults to something sane. `options` doesn't have to be passed at all.
    // 2. Initialize a bunch of strings based on the direction we're splitting.
    //    A lot of the behavior in the rest of the library is paramatized down to
    //    rely on CSS strings and classes.
    // 3. Define the dragging helper functions, and a few helpers to go with them.
    // 4. Loop through the elements while pairing them off. Every pair gets an
    //    `pair` object and a gutter.
    // 5. Actually size the pair elements, insert gutters and attach event listeners.
    var Split = function (idsOption, options) {
        if ( options === void 0 ) options = {};

        if (ssr) { return {} }

        var ids = idsOption;
        var dimension;
        var clientAxis;
        var position;
        var positionEnd;
        var clientSize;
        var elements;

        // Allow HTMLCollection to be used as an argument when supported
        if (Array.from) {
            ids = Array.from(ids);
        }

        // All DOM elements in the split should have a common parent. We can grab
        // the first elements parent and hope users read the docs because the
        // behavior will be whacky otherwise.
        var firstElement = elementOrSelector(ids[0]);
        var parent = firstElement.parentNode;
        var parentStyle = getComputedStyle ? getComputedStyle(parent) : null;
        var parentFlexDirection = parentStyle ? parentStyle.flexDirection : null;

        // Set default options.sizes to equal percentages of the parent element.
        var sizes = getOption(options, 'sizes') || ids.map(function () { return 100 / ids.length; });

        // Standardize minSize and maxSize to an array if it isn't already.
        // This allows minSize and maxSize to be passed as a number.
        var minSize = getOption(options, 'minSize', 100);
        var minSizes = Array.isArray(minSize) ? minSize : ids.map(function () { return minSize; });
        var maxSize = getOption(options, 'maxSize', Infinity);
        var maxSizes = Array.isArray(maxSize) ? maxSize : ids.map(function () { return maxSize; });

        // Get other options
        var expandToMin = getOption(options, 'expandToMin', false);
        var gutterSize = getOption(options, 'gutterSize', 10);
        var gutterAlign = getOption(options, 'gutterAlign', 'center');
        var snapOffset = getOption(options, 'snapOffset', 30);
        var snapOffsets = Array.isArray(snapOffset) ? snapOffset : ids.map(function () { return snapOffset; });
        var dragInterval = getOption(options, 'dragInterval', 1);
        var direction = getOption(options, 'direction', HORIZONTAL);
        var cursor = getOption(
            options,
            'cursor',
            direction === HORIZONTAL ? 'col-resize' : 'row-resize'
        );
        var gutter = getOption(options, 'gutter', defaultGutterFn);
        var elementStyle = getOption(
            options,
            'elementStyle',
            defaultElementStyleFn
        );
        var gutterStyle = getOption(options, 'gutterStyle', defaultGutterStyleFn);

        // 2. Initialize a bunch of strings based on the direction we're splitting.
        // A lot of the behavior in the rest of the library is paramatized down to
        // rely on CSS strings and classes.
        if (direction === HORIZONTAL) {
            dimension = 'width';
            clientAxis = 'clientX';
            position = 'left';
            positionEnd = 'right';
            clientSize = 'clientWidth';
        } else if (direction === 'vertical') {
            dimension = 'height';
            clientAxis = 'clientY';
            position = 'top';
            positionEnd = 'bottom';
            clientSize = 'clientHeight';
        }

        // 3. Define the dragging helper functions, and a few helpers to go with them.
        // Each helper is bound to a pair object that contains its metadata. This
        // also makes it easy to store references to listeners that that will be
        // added and removed.
        //
        // Even though there are no other functions contained in them, aliasing
        // this to self saves 50 bytes or so since it's used so frequently.
        //
        // The pair object saves metadata like dragging state, position and
        // event listener references.

        function setElementSize(el, size, gutSize, i) {
            // Split.js allows setting sizes via numbers (ideally), or if you must,
            // by string, like '300px'. This is less than ideal, because it breaks
            // the fluid layout that `calc(% - px)` provides. You're on your own if you do that,
            // make sure you calculate the gutter size by hand.
            var style = elementStyle(dimension, size, gutSize, i);

            Object.keys(style).forEach(function (prop) {
                // eslint-disable-next-line no-param-reassign
                el.style[prop] = style[prop];
            });
        }

        function setGutterSize(gutterElement, gutSize, i) {
            var style = gutterStyle(dimension, gutSize, i);

            Object.keys(style).forEach(function (prop) {
                // eslint-disable-next-line no-param-reassign
                gutterElement.style[prop] = style[prop];
            });
        }

        function getSizes() {
            return elements.map(function (element) { return element.size; })
        }

        // Supports touch events, but not multitouch, so only the first
        // finger `touches[0]` is counted.
        function getMousePosition(e) {
            if ('touches' in e) { return e.touches[0][clientAxis] }
            return e[clientAxis]
        }

        // Actually adjust the size of elements `a` and `b` to `offset` while dragging.
        // calc is used to allow calc(percentage + gutterpx) on the whole split instance,
        // which allows the viewport to be resized without additional logic.
        // Element a's size is the same as offset. b's size is total size - a size.
        // Both sizes are calculated from the initial parent percentage,
        // then the gutter size is subtracted.
        function adjust(offset) {
            var a = elements[this.a];
            var b = elements[this.b];
            var percentage = a.size + b.size;

            a.size = (offset / this.size) * percentage;
            b.size = percentage - (offset / this.size) * percentage;

            setElementSize(a.element, a.size, this[aGutterSize], a.i);
            setElementSize(b.element, b.size, this[bGutterSize], b.i);
        }

        // drag, where all the magic happens. The logic is really quite simple:
        //
        // 1. Ignore if the pair is not dragging.
        // 2. Get the offset of the event.
        // 3. Snap offset to min if within snappable range (within min + snapOffset).
        // 4. Actually adjust each element in the pair to offset.
        //
        // ---------------------------------------------------------------------
        // |    | <- a.minSize               ||              b.minSize -> |    |
        // |    |  | <- this.snapOffset      ||     this.snapOffset -> |  |    |
        // |    |  |                         ||                        |  |    |
        // |    |  |                         ||                        |  |    |
        // ---------------------------------------------------------------------
        // | <- this.start                                        this.size -> |
        function drag(e) {
            var offset;
            var a = elements[this.a];
            var b = elements[this.b];

            if (!this.dragging) { return }

            // Get the offset of the event from the first side of the
            // pair `this.start`. Then offset by the initial position of the
            // mouse compared to the gutter size.
            offset =
                getMousePosition(e) -
                this.start +
                (this[aGutterSize] - this.dragOffset);

            if (dragInterval > 1) {
                offset = Math.round(offset / dragInterval) * dragInterval;
            }

            // If within snapOffset of min or max, set offset to min or max.
            // snapOffset buffers a.minSize and b.minSize, so logic is opposite for both.
            // Include the appropriate gutter sizes to prevent overflows.
            if (offset <= a.minSize + a.snapOffset + this[aGutterSize]) {
                offset = a.minSize + this[aGutterSize];
            } else if (
                offset >=
                this.size - (b.minSize + b.snapOffset + this[bGutterSize])
            ) {
                offset = this.size - (b.minSize + this[bGutterSize]);
            }

            if (offset >= a.maxSize - a.snapOffset + this[aGutterSize]) {
                offset = a.maxSize + this[aGutterSize];
            } else if (
                offset <=
                this.size - (b.maxSize - b.snapOffset + this[bGutterSize])
            ) {
                offset = this.size - (b.maxSize + this[bGutterSize]);
            }

            // Actually adjust the size.
            adjust.call(this, offset);

            // Call the drag callback continously. Don't do anything too intensive
            // in this callback.
            getOption(options, 'onDrag', NOOP)(getSizes());
        }

        // Cache some important sizes when drag starts, so we don't have to do that
        // continously:
        //
        // `size`: The total size of the pair. First + second + first gutter + second gutter.
        // `start`: The leading side of the first element.
        //
        // ------------------------------------------------
        // |      aGutterSize -> |||                      |
        // |                     |||                      |
        // |                     |||                      |
        // |                     ||| <- bGutterSize       |
        // ------------------------------------------------
        // | <- start                             size -> |
        function calculateSizes() {
            // Figure out the parent size minus padding.
            var a = elements[this.a].element;
            var b = elements[this.b].element;

            var aBounds = a[getBoundingClientRect]();
            var bBounds = b[getBoundingClientRect]();

            this.size =
                aBounds[dimension] +
                bBounds[dimension] +
                this[aGutterSize] +
                this[bGutterSize];
            this.start = aBounds[position];
            this.end = aBounds[positionEnd];
        }

        function innerSize(element) {
            // Return nothing if getComputedStyle is not supported (< IE9)
            // Or if parent element has no layout yet
            if (!getComputedStyle) { return null }

            var computedStyle = getComputedStyle(element);

            if (!computedStyle) { return null }

            var size = element[clientSize];

            if (size === 0) { return null }

            if (direction === HORIZONTAL) {
                size -=
                    parseFloat(computedStyle.paddingLeft) +
                    parseFloat(computedStyle.paddingRight);
            } else {
                size -=
                    parseFloat(computedStyle.paddingTop) +
                    parseFloat(computedStyle.paddingBottom);
            }

            return size
        }

        // When specifying percentage sizes that are less than the computed
        // size of the element minus the gutter, the lesser percentages must be increased
        // (and decreased from the other elements) to make space for the pixels
        // subtracted by the gutters.
        function trimToMin(sizesToTrim) {
            // Try to get inner size of parent element.
            // If it's no supported, return original sizes.
            var parentSize = innerSize(parent);
            if (parentSize === null) {
                return sizesToTrim
            }

            if (minSizes.reduce(function (a, b) { return a + b; }, 0) > parentSize) {
                return sizesToTrim
            }

            // Keep track of the excess pixels, the amount of pixels over the desired percentage
            // Also keep track of the elements with pixels to spare, to decrease after if needed
            var excessPixels = 0;
            var toSpare = [];

            var pixelSizes = sizesToTrim.map(function (size, i) {
                // Convert requested percentages to pixel sizes
                var pixelSize = (parentSize * size) / 100;
                var elementGutterSize = getGutterSize(
                    gutterSize,
                    i === 0,
                    i === sizesToTrim.length - 1,
                    gutterAlign
                );
                var elementMinSize = minSizes[i] + elementGutterSize;

                // If element is too smal, increase excess pixels by the difference
                // and mark that it has no pixels to spare
                if (pixelSize < elementMinSize) {
                    excessPixels += elementMinSize - pixelSize;
                    toSpare.push(0);
                    return elementMinSize
                }

                // Otherwise, mark the pixels it has to spare and return it's original size
                toSpare.push(pixelSize - elementMinSize);
                return pixelSize
            });

            // If nothing was adjusted, return the original sizes
            if (excessPixels === 0) {
                return sizesToTrim
            }

            return pixelSizes.map(function (pixelSize, i) {
                var newPixelSize = pixelSize;

                // While there's still pixels to take, and there's enough pixels to spare,
                // take as many as possible up to the total excess pixels
                if (excessPixels > 0 && toSpare[i] - excessPixels > 0) {
                    var takenPixels = Math.min(
                        excessPixels,
                        toSpare[i] - excessPixels
                    );

                    // Subtract the amount taken for the next iteration
                    excessPixels -= takenPixels;
                    newPixelSize = pixelSize - takenPixels;
                }

                // Return the pixel size adjusted as a percentage
                return (newPixelSize / parentSize) * 100
            })
        }

        // stopDragging is very similar to startDragging in reverse.
        function stopDragging() {
            var self = this;
            var a = elements[self.a].element;
            var b = elements[self.b].element;

            if (self.dragging) {
                getOption(options, 'onDragEnd', NOOP)(getSizes());
            }

            self.dragging = false;

            // Remove the stored event listeners. This is why we store them.
            global$1[removeEventListener]('mouseup', self.stop);
            global$1[removeEventListener]('touchend', self.stop);
            global$1[removeEventListener]('touchcancel', self.stop);
            global$1[removeEventListener]('mousemove', self.move);
            global$1[removeEventListener]('touchmove', self.move);

            // Clear bound function references
            self.stop = null;
            self.move = null;

            a[removeEventListener]('selectstart', NOOP);
            a[removeEventListener]('dragstart', NOOP);
            b[removeEventListener]('selectstart', NOOP);
            b[removeEventListener]('dragstart', NOOP);

            a.style.userSelect = '';
            a.style.webkitUserSelect = '';
            a.style.MozUserSelect = '';
            a.style.pointerEvents = '';

            b.style.userSelect = '';
            b.style.webkitUserSelect = '';
            b.style.MozUserSelect = '';
            b.style.pointerEvents = '';

            self.gutter.style.cursor = '';
            self.parent.style.cursor = '';
            document$1.body.style.cursor = '';
        }

        // startDragging calls `calculateSizes` to store the inital size in the pair object.
        // It also adds event listeners for mouse/touch events,
        // and prevents selection while dragging so avoid the selecting text.
        function startDragging(e) {
            // Right-clicking can't start dragging.
            if ('button' in e && e.button !== 0) {
                return
            }

            // Alias frequently used variables to save space. 200 bytes.
            var self = this;
            var a = elements[self.a].element;
            var b = elements[self.b].element;

            // Call the onDragStart callback.
            if (!self.dragging) {
                getOption(options, 'onDragStart', NOOP)(getSizes());
            }

            // Don't actually drag the element. We emulate that in the drag function.
            e.preventDefault();

            // Set the dragging property of the pair object.
            self.dragging = true;

            // Create two event listeners bound to the same pair object and store
            // them in the pair object.
            self.move = drag.bind(self);
            self.stop = stopDragging.bind(self);

            // All the binding. `window` gets the stop events in case we drag out of the elements.
            global$1[addEventListener]('mouseup', self.stop);
            global$1[addEventListener]('touchend', self.stop);
            global$1[addEventListener]('touchcancel', self.stop);
            global$1[addEventListener]('mousemove', self.move);
            global$1[addEventListener]('touchmove', self.move);

            // Disable selection. Disable!
            a[addEventListener]('selectstart', NOOP);
            a[addEventListener]('dragstart', NOOP);
            b[addEventListener]('selectstart', NOOP);
            b[addEventListener]('dragstart', NOOP);

            a.style.userSelect = 'none';
            a.style.webkitUserSelect = 'none';
            a.style.MozUserSelect = 'none';
            a.style.pointerEvents = 'none';

            b.style.userSelect = 'none';
            b.style.webkitUserSelect = 'none';
            b.style.MozUserSelect = 'none';
            b.style.pointerEvents = 'none';

            // Set the cursor at multiple levels
            self.gutter.style.cursor = cursor;
            self.parent.style.cursor = cursor;
            document$1.body.style.cursor = cursor;

            // Cache the initial sizes of the pair.
            calculateSizes.call(self);

            // Determine the position of the mouse compared to the gutter
            self.dragOffset = getMousePosition(e) - self.end;
        }

        // adjust sizes to ensure percentage is within min size and gutter.
        sizes = trimToMin(sizes);

        // 5. Create pair and element objects. Each pair has an index reference to
        // elements `a` and `b` of the pair (first and second elements).
        // Loop through the elements while pairing them off. Every pair gets a
        // `pair` object and a gutter.
        //
        // Basic logic:
        //
        // - Starting with the second element `i > 0`, create `pair` objects with
        //   `a = i - 1` and `b = i`
        // - Set gutter sizes based on the _pair_ being first/last. The first and last
        //   pair have gutterSize / 2, since they only have one half gutter, and not two.
        // - Create gutter elements and add event listeners.
        // - Set the size of the elements, minus the gutter sizes.
        //
        // -----------------------------------------------------------------------
        // |     i=0     |         i=1         |        i=2       |      i=3     |
        // |             |                     |                  |              |
        // |           pair 0                pair 1             pair 2           |
        // |             |                     |                  |              |
        // -----------------------------------------------------------------------
        var pairs = [];
        elements = ids.map(function (id, i) {
            // Create the element object.
            var element = {
                element: elementOrSelector(id),
                size: sizes[i],
                minSize: minSizes[i],
                maxSize: maxSizes[i],
                snapOffset: snapOffsets[i],
                i: i,
            };

            var pair;

            if (i > 0) {
                // Create the pair object with its metadata.
                pair = {
                    a: i - 1,
                    b: i,
                    dragging: false,
                    direction: direction,
                    parent: parent,
                };

                pair[aGutterSize] = getGutterSize(
                    gutterSize,
                    i - 1 === 0,
                    false,
                    gutterAlign
                );
                pair[bGutterSize] = getGutterSize(
                    gutterSize,
                    false,
                    i === ids.length - 1,
                    gutterAlign
                );

                // if the parent has a reverse flex-direction, switch the pair elements.
                if (
                    parentFlexDirection === 'row-reverse' ||
                    parentFlexDirection === 'column-reverse'
                ) {
                    var temp = pair.a;
                    pair.a = pair.b;
                    pair.b = temp;
                }
            }

            // Determine the size of the current element. IE8 is supported by
            // staticly assigning sizes without draggable gutters. Assigns a string
            // to `size`.
            //
            // Create gutter elements for each pair.
            if (i > 0) {
                var gutterElement = gutter(i, direction, element.element);
                setGutterSize(gutterElement, gutterSize, i);

                // Save bound event listener for removal later
                pair[gutterStartDragging] = startDragging.bind(pair);

                // Attach bound event listener
                gutterElement[addEventListener](
                    'mousedown',
                    pair[gutterStartDragging]
                );
                gutterElement[addEventListener](
                    'touchstart',
                    pair[gutterStartDragging]
                );

                parent.insertBefore(gutterElement, element.element);

                pair.gutter = gutterElement;
            }

            setElementSize(
                element.element,
                element.size,
                getGutterSize(
                    gutterSize,
                    i === 0,
                    i === ids.length - 1,
                    gutterAlign
                ),
                i
            );

            // After the first iteration, and we have a pair object, append it to the
            // list of pairs.
            if (i > 0) {
                pairs.push(pair);
            }

            return element
        });

        function adjustToMin(element) {
            var isLast = element.i === pairs.length;
            var pair = isLast ? pairs[element.i - 1] : pairs[element.i];

            calculateSizes.call(pair);

            var size = isLast
                ? pair.size - element.minSize - pair[bGutterSize]
                : element.minSize + pair[aGutterSize];

            adjust.call(pair, size);
        }

        elements.forEach(function (element) {
            var computedSize = element.element[getBoundingClientRect]()[dimension];

            if (computedSize < element.minSize) {
                if (expandToMin) {
                    adjustToMin(element);
                } else {
                    // eslint-disable-next-line no-param-reassign
                    element.minSize = computedSize;
                }
            }
        });

        function setSizes(newSizes) {
            var trimmed = trimToMin(newSizes);
            trimmed.forEach(function (newSize, i) {
                if (i > 0) {
                    var pair = pairs[i - 1];

                    var a = elements[pair.a];
                    var b = elements[pair.b];

                    a.size = trimmed[i - 1];
                    b.size = newSize;

                    setElementSize(a.element, a.size, pair[aGutterSize], a.i);
                    setElementSize(b.element, b.size, pair[bGutterSize], b.i);
                }
            });
        }

        function destroy(preserveStyles, preserveGutter) {
            pairs.forEach(function (pair) {
                if (preserveGutter !== true) {
                    pair.parent.removeChild(pair.gutter);
                } else {
                    pair.gutter[removeEventListener](
                        'mousedown',
                        pair[gutterStartDragging]
                    );
                    pair.gutter[removeEventListener](
                        'touchstart',
                        pair[gutterStartDragging]
                    );
                }

                if (preserveStyles !== true) {
                    var style = elementStyle(
                        dimension,
                        pair.a.size,
                        pair[aGutterSize]
                    );

                    Object.keys(style).forEach(function (prop) {
                        elements[pair.a].element.style[prop] = '';
                        elements[pair.b].element.style[prop] = '';
                    });
                }
            });
        }

        return {
            setSizes: setSizes,
            getSizes: getSizes,
            collapse: function collapse(i) {
                adjustToMin(elements[i]);
            },
            destroy: destroy,
            parent: parent,
            pairs: pairs,
        }
    };

    /* src/components/DraggablePoint.svelte generated by Svelte v3.55.1 */
    const file$1 = "src/components/DraggablePoint.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "id", "point");
    			set_style(div0, "width", /*pointSizePx*/ ctx[3] + "px");
    			set_style(div0, "height", /*pointSizePx*/ ctx[3] + "px");
    			set_style(div0, "background-color", /*data*/ ctx[0].color);
    			attr_dev(div0, "class", "svelte-1sav52n");
    			toggle_class(div0, "dragging", /*dragging*/ ctx[1]);
    			add_location(div0, file$1, 30, 4, 993);
    			attr_dev(div1, "id", "container");
    			set_style(div1, "left", /*canvasPos*/ ctx[2].x + "px");
    			set_style(div1, "top", /*canvasPos*/ ctx[2].y + "px");
    			attr_dev(div1, "class", "svelte-1sav52n");
    			add_location(div1, file$1, 27, 0, 910);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "mousedown", /*mousedown_handler*/ ctx[6], false, false, false),
    					listen_dev(div0, "mouseup", /*mouseup_handler*/ ctx[7], false, false, false),
    					listen_dev(div0, "mousemove", stop_propagation(/*onDrag*/ ctx[4]), false, false, true)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*data*/ 1) {
    				set_style(div0, "background-color", /*data*/ ctx[0].color);
    			}

    			if (dirty & /*dragging*/ 2) {
    				toggle_class(div0, "dragging", /*dragging*/ ctx[1]);
    			}

    			if (dirty & /*canvasPos*/ 4) {
    				set_style(div1, "left", /*canvasPos*/ ctx[2].x + "px");
    			}

    			if (dirty & /*canvasPos*/ 4) {
    				set_style(div1, "top", /*canvasPos*/ ctx[2].y + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $uvars;
    	validate_store(uvars, 'uvars');
    	component_subscribe($$self, uvars, $$value => $$invalidate(8, $uvars = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DraggablePoint', slots, []);
    	let { canvas } = $$props;
    	let { data } = $$props;
    	let pointSizePx = 20;
    	let dragging = false;
    	let canvasPos = canvas.camera.worldToScreen(data.x, data.y);

    	canvasPos = {
    		x: canvasPos.x - pointSizePx / 2,
    		y: canvasPos.y - pointSizePx / 2
    	};

    	function onDrag(e) {
    		if (!dragging) return;
    		const rect = canvas.c.getBoundingClientRect();
    		let [x, y] = [e.clientX - rect.left, e.clientY - rect.top];

    		$$invalidate(2, canvasPos = {
    			x: x - pointSizePx / 2,
    			y: y - pointSizePx / 2
    		});

    		let worldPos = canvas.camera.screenToWorld(x, y);
    		$$invalidate(0, data.x = worldPos.x, data);
    		$$invalidate(0, data.y = worldPos.y, data);
    		uvars.set($uvars);

    		if (data.name.trim()) {
    			canvas.setUniformValue(data.name, [data.x, data.y]);
    			canvas.render();
    		}
    	}

    	canvas.c.addEventListener("mouseup", e => {
    		$$invalidate(1, dragging = false);
    	});

    	canvas.c.addEventListener("mousemove", onDrag);

    	$$self.$$.on_mount.push(function () {
    		if (canvas === undefined && !('canvas' in $$props || $$self.$$.bound[$$self.$$.props['canvas']])) {
    			console.warn("<DraggablePoint> was created without expected prop 'canvas'");
    		}

    		if (data === undefined && !('data' in $$props || $$self.$$.bound[$$self.$$.props['data']])) {
    			console.warn("<DraggablePoint> was created without expected prop 'data'");
    		}
    	});

    	const writable_props = ['canvas', 'data'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DraggablePoint> was created with unknown prop '${key}'`);
    	});

    	const mousedown_handler = () => $$invalidate(1, dragging = true);

    	const mouseup_handler = () => {
    		$$invalidate(1, dragging = false);
    	};

    	$$self.$$set = $$props => {
    		if ('canvas' in $$props) $$invalidate(5, canvas = $$props.canvas);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	$$self.$capture_state = () => ({
    		uvars,
    		canvas,
    		data,
    		pointSizePx,
    		dragging,
    		canvasPos,
    		onDrag,
    		$uvars
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvas' in $$props) $$invalidate(5, canvas = $$props.canvas);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    		if ('pointSizePx' in $$props) $$invalidate(3, pointSizePx = $$props.pointSizePx);
    		if ('dragging' in $$props) $$invalidate(1, dragging = $$props.dragging);
    		if ('canvasPos' in $$props) $$invalidate(2, canvasPos = $$props.canvasPos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		data,
    		dragging,
    		canvasPos,
    		pointSizePx,
    		onDrag,
    		canvas,
    		mousedown_handler,
    		mouseup_handler
    	];
    }

    class DraggablePoint extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { canvas: 5, data: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DraggablePoint",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get canvas() {
    		throw new Error("<DraggablePoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canvas(value) {
    		throw new Error("<DraggablePoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<DraggablePoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<DraggablePoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/App.svelte generated by Svelte v3.55.1 */

    const { console: console_1 } = globals;
    const file = "src/components/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    // (109:2) {#if canvasIsReady}
    function create_if_block_4(ctx) {
    	let sidebar;
    	let updating_collapsed;
    	let current;

    	function sidebar_collapsed_binding(value) {
    		/*sidebar_collapsed_binding*/ ctx[13](value);
    	}

    	let sidebar_props = {
    		canvas: /*canvas*/ ctx[1],
    		editorText: /*workspace*/ ctx[11].code
    	};

    	if (/*sidebarCollapsed*/ ctx[0] !== void 0) {
    		sidebar_props.collapsed = /*sidebarCollapsed*/ ctx[0];
    	}

    	sidebar = new Sidebar({ props: sidebar_props, $$inline: true });
    	binding_callbacks.push(() => bind(sidebar, 'collapsed', sidebar_collapsed_binding));
    	sidebar.$on("variableChange", /*variableChange_handler*/ ctx[14]);

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const sidebar_changes = {};
    			if (dirty & /*canvas*/ 2) sidebar_changes.canvas = /*canvas*/ ctx[1];

    			if (!updating_collapsed && dirty & /*sidebarCollapsed*/ 1) {
    				updating_collapsed = true;
    				sidebar_changes.collapsed = /*sidebarCollapsed*/ ctx[0];
    				add_flush_callback(() => updating_collapsed = false);
    			}

    			sidebar.$set(sidebar_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(109:2) {#if canvasIsReady}",
    		ctx
    	});

    	return block;
    }

    // (117:2) {#if sidebarCollapsed && showUI}
    function create_if_block_3(ctx) {
    	let button;
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			i = element("i");
    			attr_dev(i, "class", "bi bi-chevron-double-right svelte-15mw8jo");
    			add_location(i, file, 118, 4, 4549);
    			attr_dev(button, "id", "expand-btn");
    			attr_dev(button, "class", "svelte-15mw8jo");
    			add_location(button, file, 117, 3, 4477);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, i);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(117:2) {#if sidebarCollapsed && showUI}",
    		ctx
    	});

    	return block;
    }

    // (125:2) {#if canvasIsReady && showUI}
    function create_if_block_1(ctx) {
    	let previous_key = [/*cameraChange*/ ctx[4], /*pointChange*/ ctx[5]];
    	let key_block_anchor;
    	let current;
    	let key_block = create_key_block(ctx);

    	const block = {
    		c: function create() {
    			key_block.c();
    			key_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			key_block.m(target, anchor);
    			insert_dev(target, key_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cameraChange, pointChange*/ 48 && safe_not_equal(previous_key, previous_key = [/*cameraChange*/ ctx[4], /*pointChange*/ ctx[5]])) {
    				group_outros();
    				transition_out(key_block, 1, 1, noop);
    				check_outros();
    				key_block = create_key_block(ctx);
    				key_block.c();
    				transition_in(key_block, 1);
    				key_block.m(key_block_anchor.parentNode, key_block_anchor);
    			} else {
    				key_block.p(ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(key_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(key_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(key_block_anchor);
    			key_block.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(125:2) {#if canvasIsReady && showUI}",
    		ctx
    	});

    	return block;
    }

    // (128:5) {#if v.type === "vec2"}
    function create_if_block_2(ctx) {
    	let draggablepoint;
    	let current;

    	draggablepoint = new DraggablePoint({
    			props: {
    				canvas: /*canvas*/ ctx[1],
    				data: /*v*/ ctx[24]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(draggablepoint.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(draggablepoint, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const draggablepoint_changes = {};
    			if (dirty & /*canvas*/ 2) draggablepoint_changes.canvas = /*canvas*/ ctx[1];
    			if (dirty & /*$uvars*/ 1024) draggablepoint_changes.data = /*v*/ ctx[24];
    			draggablepoint.$set(draggablepoint_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(draggablepoint.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(draggablepoint.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(draggablepoint, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(128:5) {#if v.type === \\\"vec2\\\"}",
    		ctx
    	});

    	return block;
    }

    // (127:4) {#each $uvars as v (v.id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = /*v*/ ctx[24].type === "vec2" && create_if_block_2(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*v*/ ctx[24].type === "vec2") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$uvars*/ 1024) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(127:4) {#each $uvars as v (v.id)}",
    		ctx
    	});

    	return block;
    }

    // (126:3) {#key [cameraChange, pointChange]}
    function create_key_block(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*$uvars*/ ctx[10];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*v*/ ctx[24].id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*canvas, $uvars*/ 1026) {
    				each_value = /*$uvars*/ ctx[10];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_key_block.name,
    		type: "key",
    		source: "(126:3) {#key [cameraChange, pointChange]}",
    		ctx
    	});

    	return block;
    }

    // (136:1) {#if canvasIsReady && showUI}
    function create_if_block(ctx) {
    	let coordinatebox;
    	let current;

    	coordinatebox = new CoordinateBox({
    			props: {
    				canvas: /*canvas*/ ctx[1],
    				mouse: /*mousePos*/ ctx[3],
    				fval: /*canvas*/ ctx[1].computeFval(/*mousePos*/ ctx[3])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(coordinatebox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(coordinatebox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const coordinatebox_changes = {};
    			if (dirty & /*canvas*/ 2) coordinatebox_changes.canvas = /*canvas*/ ctx[1];
    			if (dirty & /*mousePos*/ 8) coordinatebox_changes.mouse = /*mousePos*/ ctx[3];
    			if (dirty & /*canvas, mousePos*/ 10) coordinatebox_changes.fval = /*canvas*/ ctx[1].computeFval(/*mousePos*/ ctx[3]);
    			coordinatebox.$set(coordinatebox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(coordinatebox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(coordinatebox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(coordinatebox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(136:1) {#if canvasIsReady && showUI}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let canvas_1;
    	let t2;
    	let t3;
    	let current;
    	let if_block0 = /*canvasIsReady*/ ctx[2] && create_if_block_4(ctx);
    	let if_block1 = /*sidebarCollapsed*/ ctx[0] && /*showUI*/ ctx[9] && create_if_block_3(ctx);
    	let if_block2 = /*canvasIsReady*/ ctx[2] && /*showUI*/ ctx[9] && create_if_block_1(ctx);
    	let if_block3 = /*canvasIsReady*/ ctx[2] && /*showUI*/ ctx[9] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			canvas_1 = element("canvas");
    			t2 = space();
    			if (if_block2) if_block2.c();
    			t3 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(div0, "id", "sidebar-div");
    			attr_dev(div0, "class", "svelte-15mw8jo");
    			set_style(div0, "display", /*sidebarCollapsed*/ ctx[0] ? "none" : "block");
    			add_location(div0, file, 104, 1, 4053);
    			attr_dev(canvas_1, "class", "svelte-15mw8jo");
    			add_location(canvas_1, file, 122, 2, 4620);
    			attr_dev(div1, "id", "canvas-div");
    			attr_dev(div1, "class", "svelte-15mw8jo");
    			add_location(div1, file, 115, 1, 4393);
    			attr_dev(main, "class", "svelte-15mw8jo");
    			add_location(main, file, 103, 0, 4044);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			if (if_block0) if_block0.m(div0, null);
    			/*div0_binding*/ ctx[15](div0);
    			append_dev(main, t0);
    			append_dev(main, div1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, canvas_1);
    			/*canvas_1_binding*/ ctx[17](canvas_1);
    			append_dev(div1, t2);
    			if (if_block2) if_block2.m(div1, null);
    			/*div1_binding*/ ctx[18](div1);
    			append_dev(main, t3);
    			if (if_block3) if_block3.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*canvasIsReady*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*canvasIsReady*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*sidebarCollapsed*/ 1) {
    				set_style(div0, "display", /*sidebarCollapsed*/ ctx[0] ? "none" : "block");
    			}

    			if (/*sidebarCollapsed*/ ctx[0] && /*showUI*/ ctx[9]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*canvasIsReady*/ ctx[2] && /*showUI*/ ctx[9]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*canvasIsReady, showUI*/ 516) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*canvasIsReady*/ ctx[2] && /*showUI*/ ctx[9]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty & /*canvasIsReady, showUI*/ 516) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(main, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			/*div0_binding*/ ctx[15](null);
    			if (if_block1) if_block1.d();
    			/*canvas_1_binding*/ ctx[17](null);
    			if (if_block2) if_block2.d();
    			/*div1_binding*/ ctx[18](null);
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $compilationErrors;
    	let $uvars;
    	validate_store(compilationErrors, 'compilationErrors');
    	component_subscribe($$self, compilationErrors, $$value => $$invalidate(22, $compilationErrors = $$value));
    	validate_store(uvars, 'uvars');
    	component_subscribe($$self, uvars, $$value => $$invalidate(10, $uvars = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let canvas;
    	let canvasIsReady = false;
    	let mousePos = { x: 0, y: 0 };
    	let cameraChange = false;
    	let pointChange = false;
    	let draggingCanvas = false;
    	let sidebarCollapsed = false;
    	let sidebarDiv;
    	let canvasDiv;
    	let canvasElem;
    	let gutterElem;
    	let split;
    	let lastSplitSizes = [40, 60];
    	let showUI = true;
    	let workspace = workspaceExamples[defaultWorkspaceName];

    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		console.log("App.svelte ran");

    		$$invalidate(12, split = Split(["#sidebar-div", "#canvas-div"], {
    			sizes: lastSplitSizes,
    			minSize: [380, 250],
    			gutterSize: 5,
    			gutterAlign: "start",
    			onDragEnd: () => {
    				lastSplitSizes = split.getSizes();
    			}
    		}));

    		gutterElem = document.querySelector(".gutter");
    		$$invalidate(1, canvas = new Canvas(canvasElem, workspace));

    		if ($compilationErrors.length > 0) {
    			console.error("error in default workspace code: ", $compilationErrors[0].toString());
    		} else {
    			yield canvas.init(s => console.error(s));
    		}

    		$$invalidate(2, canvasIsReady = true);
    		canvasElem.addEventListener("mousedown", e => draggingCanvas = true);
    		canvasElem.addEventListener("mouseup", e => draggingCanvas = false);
    		canvasElem.addEventListener("mouseleave", e => draggingCanvas = false); // prevent jank when dragging onto point

    		canvasElem.addEventListener("mousemove", e => {
    			if (draggingCanvas) canvas.camera.move(e.movementX, e.movementY);
    			$$invalidate(3, mousePos = canvas.camera.screenToWorld(e.offsetX, e.offsetY));
    			$$invalidate(1, canvas.mousePos = mousePos, canvas);
    		});

    		canvasDiv.addEventListener('wheel', e => {
    			e.preventDefault();
    			const rect = canvasElem.getBoundingClientRect();
    			const [x, y] = [e.clientX - rect.left, e.clientY - rect.top];
    			canvas.camera.scaleAt(x, y, Math.pow(1.001, e.deltaY));
    		});

    		canvasElem.addEventListener("camera", e => {
    			$$invalidate(4, cameraChange = !cameraChange); // trigger reactivity
    			canvas.render();
    		});

    		function resetCamera() {
    			canvas.camera.reset();
    		}

    		function toggleUI() {
    			$$invalidate(9, showUI = !showUI);
    			$$invalidate(0, sidebarCollapsed = !showUI);
    		}

    		document.addEventListener("keydown", e => {
    			if (document.activeElement !== document.body) return;

    			switch (e.key) {
    				case "h":
    					resetCamera();
    					break;
    				case "u":
    					toggleUI();
    					break;
    			}
    		});

    		let resizeObserver = new ResizeObserver(() => {
    				resizeCanvasToDisplaySize(canvasElem);
    				$$invalidate(1, canvas.camera.scale.x = canvas.camera.scale.y * canvas.camera.aspect(), canvas);
    				$$invalidate(4, cameraChange = !cameraChange);
    				canvas.render();
    			});

    		resizeObserver.observe(canvasElem);
    	}));

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function sidebar_collapsed_binding(value) {
    		sidebarCollapsed = value;
    		$$invalidate(0, sidebarCollapsed);
    	}

    	const variableChange_handler = e => {
    		if (e.detail.type === "vec2") $$invalidate(5, pointChange = !pointChange);
    	};

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			sidebarDiv = $$value;
    			$$invalidate(6, sidebarDiv);
    		});
    	}

    	const click_handler = () => $$invalidate(0, sidebarCollapsed = false);

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasElem = $$value;
    			$$invalidate(8, canvasElem);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvasDiv = $$value;
    			$$invalidate(7, canvasDiv);
    		});
    	}

    	$$self.$capture_state = () => ({
    		__awaiter,
    		onMount,
    		Canvas,
    		CoordinateBox,
    		Sidebar,
    		compilationErrors,
    		uvars,
    		resizeCanvasToDisplaySize,
    		Split,
    		DraggablePoint,
    		workspaceExamples,
    		defaultWorkspaceName,
    		canvas,
    		canvasIsReady,
    		mousePos,
    		cameraChange,
    		pointChange,
    		draggingCanvas,
    		sidebarCollapsed,
    		sidebarDiv,
    		canvasDiv,
    		canvasElem,
    		gutterElem,
    		split,
    		lastSplitSizes,
    		showUI,
    		workspace,
    		$compilationErrors,
    		$uvars
    	});

    	$$self.$inject_state = $$props => {
    		if ('__awaiter' in $$props) __awaiter = $$props.__awaiter;
    		if ('canvas' in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ('canvasIsReady' in $$props) $$invalidate(2, canvasIsReady = $$props.canvasIsReady);
    		if ('mousePos' in $$props) $$invalidate(3, mousePos = $$props.mousePos);
    		if ('cameraChange' in $$props) $$invalidate(4, cameraChange = $$props.cameraChange);
    		if ('pointChange' in $$props) $$invalidate(5, pointChange = $$props.pointChange);
    		if ('draggingCanvas' in $$props) draggingCanvas = $$props.draggingCanvas;
    		if ('sidebarCollapsed' in $$props) $$invalidate(0, sidebarCollapsed = $$props.sidebarCollapsed);
    		if ('sidebarDiv' in $$props) $$invalidate(6, sidebarDiv = $$props.sidebarDiv);
    		if ('canvasDiv' in $$props) $$invalidate(7, canvasDiv = $$props.canvasDiv);
    		if ('canvasElem' in $$props) $$invalidate(8, canvasElem = $$props.canvasElem);
    		if ('gutterElem' in $$props) gutterElem = $$props.gutterElem;
    		if ('split' in $$props) $$invalidate(12, split = $$props.split);
    		if ('lastSplitSizes' in $$props) lastSplitSizes = $$props.lastSplitSizes;
    		if ('showUI' in $$props) $$invalidate(9, showUI = $$props.showUI);
    		if ('workspace' in $$props) $$invalidate(11, workspace = $$props.workspace);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*split, sidebarCollapsed*/ 4097) {
    			if (split) {
    				if (sidebarCollapsed) gutterElem.style.display = "none"; else gutterElem.style.display = "block";
    			}
    		}
    	};

    	return [
    		sidebarCollapsed,
    		canvas,
    		canvasIsReady,
    		mousePos,
    		cameraChange,
    		pointChange,
    		sidebarDiv,
    		canvasDiv,
    		canvasElem,
    		showUI,
    		$uvars,
    		workspace,
    		split,
    		sidebar_collapsed_binding,
    		variableChange_handler,
    		div0_binding,
    		click_handler,
    		canvas_1_binding,
    		div1_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
