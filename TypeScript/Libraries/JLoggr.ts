/// <reference path="../Definitions/jquery.d.ts" />

/*
	JLoggr - Open Source JavaScript Logging Utility

    Based on
      Blackbird - http://www.gscottolson.com/blackbirdjs/
	  javascript-stacktrace - https://github.com/eriwen/javascript-stacktrace
      json-stringify-safe - https://github.com/isaacs/json-stringify-safe

    Modified by Tom Wagner (twag) for use with TypeScript

    November, 2013 - v0.1.0 inital release
*/


module JLoggr {

    export class JLoggrState {

        constructor() {
            this.load = false;
            this.pos = 1;  // upper right
            this.size = 0; // small
        }

        size: number;
        pos: number;
        load: bool;
    }

    export class JLoggrBase {

        constructor() {

            this.state = this.getState();
            //this.addEvent(window, 'load', this.onLoad);

            $(() => { this.onLoad(); })
           
        }

        //NAMESPACE = 'log';
        IE6_POSITION_FIXED = true; // enable IE6 {position:fixed}

        JLoggrCookieName = "JLoggrSettings";

        JLoggr: HTMLElement;
        outputList;
        cache = [];

        state: JLoggrState;
        classes = {};
        profiler = {};
        IDs = {
            JLoggr: 'JLoggr',
            checkbox: 'bbVis',
            filters: 'bbFilters',
            controls: 'bbControls',
            size: 'bbSize'
        }

        messageTypes = { //order of these properties imply render order of filter controls
            debug: true,
            info: true,
            warn: true,
            error: true,
            profile: true
        };


        ///
        generateMarkup() {
            var spans = [];
            for (var type in this.messageTypes) {
                spans.push(['<span class="', type, '" type="', type, '"></span>'].join(''));
            }

            var newNode = document.createElement('DIV');
            newNode.id = this.IDs.JLoggr;
            newNode.style.display = 'none';JLoggr
            newNode.innerHTML = [
                '<div class="" style="background:#aaa;overflow:hidden;">',
'<div class="" style="background:#3f3f3f;padding:5px;color:#fe9516;overflow:hidden;"><div class="pull-left">JLoggr </div>',
'<div class = "pull-right" >Level: ',
'<a href = "#" style="color:white;"  class = "badge" > Debug </a>',
'&nbsp; <a href = "#" style="color:white;" > Info </a>',
'&nbsp; <a href = "#" style="color:white;" > Warning </a>',
'&nbsp; <a href = "#" style="color:white;" > Error </a>',
'</div> </div> ',
'<div class="">',
                     //   '<div id="', this.IDs.filters, '" class="filters" title="click to filter by message type">', spans.join(''), '</div>',
                    '</div>',
                    '<div class="" style="padding:5px;background:#d9edf6;overflow:hidden;">',
                        '<div id="', this.IDs.controls, '" class="controls">',
                        '<div class="pull-left">',
                            '<div class="btn-group"><a href="#" class="btn btn-small" id="', this.IDs.size, '" title="contract" op="resize">Resize</a>',
                            '<a href="#" class="btn btn-small" id="', this.IDs.size, '" title="contract" op="resize">Full</a></div>',
                            '&nbsp;<a href="#" class="btn btn-small" op="clear">Clear</a>',
                            '&nbsp;<a href="#" class="btn btn-small" op="move">Move</a>',
                            '</div><div class="pull-right">',
                            '&nbsp;<a href="#" class="btn btn-small" op="close">Close</a>',
                        '</div></div>',
                    '</div>',
                '</div>',
                '<div class="JLoggr-main">',
                    '<div class="JLoggr-left"></div><div class="JLoggr-mainBody">',
                        '<ol>', this.cache.join(''), '</ol>',
                    '</div><div class="JLoggr-right"></div>',
                '</div>',
                '<div class="" style="background:#3f3f3f;padding:5px;color:#fe9516;">',
                    '<div class="JLoggr-left"><label for="', this.IDs.checkbox, '"><input type="checkbox" id="', this.IDs.checkbox, '" />&nbsp;Visible on page load</label></div>',
                    '<div class="JLoggr-right"></div>',
                '</div>'
            ].join('');
            return newNode;
        }

        backgroundImage() { //(IE6 only) change <BODY> tag's background to resolve {position:fixed} support
            var bodyTag = <HTMLScriptElement>document.getElementsByTagName('BODY')[0];

            if (bodyTag.currentStyle && this.IE6_POSITION_FIXED) {
                if (bodyTag.currentStyle.backgroundImage == 'none') {
                    bodyTag.style.backgroundImage = 'url(about:blank)';
                }
                if (bodyTag.currentStyle.backgroundAttachment == 'scroll') {
                    bodyTag.style.backgroundAttachment = 'fixed';
                }
            }
        }

        addMessage(type: string, content: string, caller?:string) { //adds a message to the output list
            //content = (content.constructor == Array) ? content.join('') : content;
                        
            if (this.outputList) {
                var newMsg = document.createElement('LI');
                newMsg.className = type; 
                newMsg.innerHTML = [type, caller, content].join(' | ');
                this.outputList.appendChild(newMsg);
                this.scrollToBottom();
            } else {
                this.cache.push(['<li class="', type, '">', type + " | " + caller + " | ", content, '</li>'].join(''));
            }
        }

        clear() { //clear list output
            this.outputList.innerHTML = '';
        }

        clickControl(evt) {
            if (!evt) evt = window.event;
            var el = (evt.target) ? evt.target : evt.srcElement;
            if (el.tagName == 'A') {
                switch (el.getAttributeNode('op').nodeValue) {
                    case 'resize': this.resize(); break;
                    case 'clear': this.clear(); break;
                    case 'move': this.reposition(); break;
                    case 'close': this.hide(); break;
                }
            }
        }

        clickFilter(evt) { //show/hide a specific message type
            if (!evt) evt = window.event;
            var span = (evt.target) ? evt.target : evt.srcElement;

            if (span && span.tagName == 'SPAN') {

                var type = span.getAttributeNode('type').nodeValue;

                if (evt.altKey) {
                    var filters = document.getElementById(this.IDs.filters).getElementsByTagName('SPAN');

                    var active = 0;
                    for (var entry in this.messageTypes) {
                        if (this.messageTypes[entry]) {
                            active++;
                        }
                    }
                    var oneActiveFilter = (active == 1 && this.messageTypes[type]);

                    for (var i = 0; filters[i]; i++) {

                        var spanType = (<HTMLScriptElement>filters[i]).getAttributeNode('type').nodeValue;


                        (<HTMLScriptElement>filters[i]).className = (oneActiveFilter || (spanType == type)) ? spanType : spanType + 'Disabled';
                        this.messageTypes[spanType] = oneActiveFilter || (spanType == type);
                    }
                }
                else {
                    this.messageTypes[type] = !this.messageTypes[type];
                    span.className = (this.messageTypes[type]) ? type : type + 'Disabled';
                }

                //build outputList's class from messageTypes object
                var disabledTypes = [];
                for (type in this.messageTypes) {
                    if (!this.messageTypes[type]) disabledTypes.push(type);
                }
                disabledTypes.push('');
                this.outputList.className = disabledTypes.join('Hidden ');

                this.scrollToBottom();
            }
        }

        clickVis(evt) {
            if (!evt) evt = window.event;
            var el = (evt.target) ? evt.target : evt.srcElement;

            this.state.load = el.checked;
            this.setState();
        }

        scrollToBottom() { //scroll list output to the bottom
            this.outputList.scrollTop = this.outputList.scrollHeight;
        }

        isVisible(): bool { //determine the visibility
            return (this.JLoggr.style.display == 'block');
        }

        hide() {
            this.JLoggr.style.display = 'none';
        }

        show() {

            var body = document.getElementsByTagName('BODY')[0];

            body.removeChild(this.JLoggr);
            body.appendChild(this.JLoggr);
            this.JLoggr.style.display = 'block';
        }

        //sets the position
        reposition(position?: number) {
            if (position === undefined || position == null) {
                position = (this.state && this.state.pos === null) ? 1 : (this.state.pos + 1) % 4; //set to initial position ('topRight') or move to next position
            }

            switch (position) {
                case 0: this.classes[0] = 'bbTopLeft'; break;
                case 1: this.classes[0] = 'bbTopRight'; break;
                case 2: this.classes[0] = 'bbBottomLeft'; break;
                case 3: this.classes[0] = 'bbBottomRight'; break;
            }
            this.state.pos = position;
            this.setState();
        }

        resize(size?) {
            if (size === undefined || size === null) {
                size = (this.state && this.state.size == null) ? 0 : (this.state.size + 1) % 2;
            }

            this.classes[1] = (size === 0) ? 'bbSmall' : 'bbLarge'

            var span = document.getElementById(this.IDs.size);
            span.title = (size === 1) ? 'small' : 'large';
            span.className = span.title + " btn btn-small";

            this.state.size = size;
            this.setState();
            this.scrollToBottom();
        }

        setCookie(c_name: string, value: string, exdays: number) {
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + exdays);
            var c_value = encodeURI(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
            document.cookie = c_name + "=" + c_value;
        }

        getCookie(c_name: string) {
            var i, x, y, ARRcookies = document.cookie.split(";");
            for (i = 0; i < ARRcookies.length; i++) {
                x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
                y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
                x = x.replace(/^\s+|\s+$/g, "");
                if (x == c_name) {
                    return decodeURI(y);
                }
            }
        }

        setState() {

            try {
                var props = [];
                //for (var entry in this.state) {
                //    var value = (this.state[entry] && this.state[entry].constructor === String) ? '"' + this.state[entry] + '"' : this.state[entry];
                //    props.push(entry + ':' + value);
                //}

                //props.push("load:" + this.state.load);
                //props.push("pos:" + this.state.pos);
                //props.push("size:" + this.state.size);

                //var propString: string = props.join(',');

                //var expiration = new Date();
                //expiration.setDate(expiration.getDate() + 14);

                ////log.info("Exp: " + expiration);
                //document.cookie = ['blackbird={', propString, '}; expires=', expiration.toUTCString(), ';'].join('');

                this.setCookie(this.JLoggrCookieName, JSON.stringify(this.state), 14);
                //log.info(document.cookie);

                var newClass = [];
                for (var word in this.classes) {
                    newClass.push(this.classes[word]);
                }
                this.JLoggr.className = newClass.join(' ');
            }
            catch (e) {
                log.error("can't set state: " + e);
            }
        }


        getState(): JLoggrState {

            //var re = new RegExp("/blackbird=({[^;]+})(;|\b|$)/");
            //var match = re.exec(document.cookie);


            //if (match != undefined && match.length > 0) {

            //    var stateObj = eval('(' + match[1] + ')');

            //    var loadState = new BlackBirdState();
            //    loadState.load = stateObj.load;
            //    loadState.pos = stateObj.pos;
            //    loadState.size = stateObj.size;

            //    return loadState;

            //}

            var value = this.getCookie(this.JLoggrCookieName);

            if (value != undefined) {
                try {
                    return JSON.parse(value);
                }
                catch (e) {
                    //alert("Can't load blackbird settings ["+value+"]: " + e);
                    this.setCookie(this.JLoggrCookieName, JSON.stringify(new JLoggrState()), 14);

                }

            }

            return new JLoggrState();

        }

        readKey(eventObject: JQueryEventObject) {
            var code = 113; //F2 key

            if (eventObject.which == code) {

                var visible = this.isVisible();

                var shiftKey: bool = eventObject.shiftKey;
                var altKey: bool = eventObject.altKey;

                if (visible && shiftKey && altKey) {
                    this.clear();
                }
                else if (visible && shiftKey) {
                    this.reposition();
                }
                else if (!shiftKey && !altKey) {
                    (visible) ? this.hide() : this.show();
                }
            }
        }


        //event management ( thanks John Resig )
        addEvent(obj, type, fn) {
            var obj = (obj.constructor === String) ? document.getElementById(obj) : obj;
            if (obj.attachEvent) {
                obj['e' + type + fn] = fn;
                obj[type + fn] = function () { obj['e' + type + fn](window.event) };
                obj.attachEvent('on' + type, obj[type + fn]);
            } else obj.addEventListener(type, fn, false);
        }

        removeEvent(obj, type, fn) {
            var obj = (obj.constructor === String) ? document.getElementById(obj) : obj;
            if (obj.detachEvent) {
                obj.detachEvent('on' + type, obj[type + fn]);
                obj[type + fn] = null;
            } else obj.removeEventListener(type, fn, false);
        }

        //addEvent(window, 'load',
        /* initialize Blackbird when the page loads */
        //  function() {

        onLoad() {
            try {

                var body = document.getElementsByTagName('BODY')[0];

                var element = this.generateMarkup();

                this.JLoggr = <HTMLElement>body.appendChild(element); //this.generateMarkup());
                this.outputList = this.JLoggr.getElementsByTagName('OL')[0];

                this.backgroundImage();

                //add events
                $("#" + this.IDs.checkbox).click((eventObject: JQueryEventObject) => { this.clickVis(eventObject); });
                $("#" + this.IDs.filters).click((eventObject: JQueryEventObject) => { this.clickFilter(eventObject); });
                $("#" + this.IDs.controls).click((eventObject: JQueryEventObject) => { this.clickControl(eventObject); });
                $(document).keyup((eventObject: JQueryEventObject) => { this.readKey(eventObject); });

                //this.addEvent(this.IDs.checkbox, 'click', this.clickVis);
                //this.addEvent(this.IDs.filters, 'click', this.clickFilter);
                //this.addEvent(this.IDs.controls, 'click', this.clickControl);
                //this.addEvent(document, 'keyup', this.readKey);

                this.resize(this.state.size);
                this.reposition(this.state.pos);
                if (this.state.load) {
                    this.show();
                    (<HTMLInputElement>document.getElementById(this.IDs.checkbox)).checked = true;
                }

                this.scrollToBottom();

                this.addEvent(window, 'unload', function () {
                    //this.removeEvent(this.IDs.checkbox, 'click', this.clickVis);
                    //this.removeEvent(this.IDs.filters, 'click', this.clickFilter);
                    //this.removeEvent(this.IDs.controls, 'click', this.clickControl);
                    //this.removeEvent(document, 'keyup', this.readKey);
                });
            }
            catch (err) {
                alert("Error in onLoad: " + err);
            }
        }
    }

    
    export class Logger {

        static JLoggrInstance: JLoggrBase;
        source:string = "?";

        constructor(source?:string) {
            try {
                if (source != undefined) {
                    this.source = source;
                }
            }
            catch (err) {
                alert("Error in Logger(): " + err);
            }
        }

        init() {
            Logger.JLoggrInstance.show();
            this.error('<b>Log</b> can only be initialized once');
        }

        toggle() { (Logger.JLoggrInstance.isVisible()) ? Logger.JLoggrInstance.hide() : Logger.JLoggrInstance.show(); }
        resize() { Logger.JLoggrInstance.resize(); }
        clear() { Logger.JLoggrInstance.clear(); }
        move() { Logger.JLoggrInstance.reposition(); }
        debug(msg: string) { Logger.JLoggrInstance.addMessage('debug', msg, this.source); }
        warn(msg: string) { Logger.JLoggrInstance.addMessage('warn', msg, this.source); }
        info(msg: string) { Logger.JLoggrInstance.addMessage('info', msg, this.source); }
        error(msg: string) { Logger.JLoggrInstance.addMessage('error', msg, this.source); }

        stackTrace(err) {
            try {
                var pst = new PrintStackTrace(new PrintStackTraceOptions(err));
                Logger.JLoggrInstance.addMessage('trace', pst.Result().join('<br>'));
            }
            catch(err)
            {
                
            }
                        
        }

        object(obj:Object) {
            try {
                var stringifySafe = new JSONStringifySafe();
                var objString = stringifySafe.stringify(obj, null, 2);
                Logger.JLoggrInstance.addMessage('object', objString, this.source);
            }
            catch (err)
            {
                Logger.JLoggrInstance.addMessage('object', "Can't represent object: " + err, this.source);
            }
        }

        JQueryAjaxLogger = (jqXHR: JQueryXHR, textStatus: string, errorThrow: string) => {
            Logger.JLoggrInstance.addMessage('Error', "JQuery Ajax Error<br>Status: " + textStatus + "<br> Error:" + errorThrow);
            var stringifySafe = new JSONStringifySafe();
            var objString = stringifySafe.stringify(jqXHR, null, 2);
            Logger.JLoggrInstance.addMessage('Error', objString);
        };

        profile(label) {
            var currentTime = new Date(); //record the current time when profile() is executed

            if (label == undefined || label == '') {
                Logger.JLoggrInstance.addMessage('error', '<b>ERROR:</b> Please specify a label for your profile statement');
            }
            else if (Logger.JLoggrInstance.profiler[label]) {
                //Logger.JLoggrInstance.addMessage('profile', [label, ': ', currentTime - Logger.JLoggrInstance.profiler[label], 'ms'].join(''));
                delete Logger.JLoggrInstance.profiler[label];
            }
            else {
                Logger.JLoggrInstance.profiler[label] = currentTime;
                Logger.JLoggrInstance.addMessage('profile', label);
            }
            return currentTime;
        }
    }
    
    export class PrintStackTraceOptions {
        e;
        guess: bool = true;

        constructor(e?) {
            this.e = e;

            if (e != undefined) {
                this.guess = false;
            }
        }
    }

    class PrintStackTrace {

        options: PrintStackTraceOptions;
        ex;
        guess: bool;
        p: PrintStackTraceImplementation;
        result;

        constructor(options?: PrintStackTraceOptions) {
            try {
                if (options == undefined) {
                    this.options = new PrintStackTraceOptions();
                    this.ex = undefined;
                    this.guess = true;
                }
                else {
                    this.options = options;
                    this.ex = options.e || null;
                    this.guess = !!options.guess;
                }
                this.p = new PrintStackTraceImplementation();// new printStackTrace.implementation();
                this.result = this.p.run(this.ex);

                //return this.Result();

            }
            catch (err) {
                log.error("printStackTrace() error: " + err);
            }
        }

        Result() {
            return (this.guess) ? this.p.guessAnonymousFunctions(this.result) : this.result;
        }
    }

    class PrintStackTraceImplementation {
        undef() {
            return undefined;
        }
        /**
     * @param {Error} ex The error to create a stacktrace from (optional)
     * @param {String} mode Forced mode (optional, mostly for unit tests)
     */
        run(ex?, mode?:string) {

            if (ex == undefined) {
                ex = this.createException();
            }
            //ex = ex || this.createException();

            // examine exception properties w/o debugger
            //for (var prop in ex) {alert("Ex['" + prop + "']=" + ex[prop]);}


            if (mode == undefined) {
                mode = this.mode(ex);
            }
            //mode = mode || this.mode(ex);

            if (mode === 'other') {
                return this.other(arguments.callee);
            } else {
                return this[mode](ex);
            }
        }

        createException() {
            try {
                this.undef();
            } catch (e) {
                return e;
            }
        }

        /**
         * Mode could differ for different exception, e.g.
         * exceptions in Chrome may or may not have arguments or stack.
         *
         * @return {String} mode of operation for the exception
         */
        mode(e) {

            var win:any = window;
            if (e['arguments'] && e.stack) {
                return 'chrome';
            } else if (e.stack && e.sourceURL) {
                return 'safari';
            } else if (e.stack && e.number) {
                return 'ie';
            } else if (typeof e.message === 'string' && typeof window !== 'undefined' && win.opera) {
                // e.message.indexOf("Backtrace:") > -1 -> opera
                // !e.stacktrace -> opera
                if (!e.stacktrace) {
                    return 'opera9'; // use e.message
                }
                // 'opera#sourceloc' in e -> opera9, opera10a
                if (e.message.indexOf('\n') > -1 && e.message.split('\n').length > e.stacktrace.split('\n').length) {
                    return 'opera9'; // use e.message
                }
                // e.stacktrace && !e.stack -> opera10a
                if (!e.stack) {
                    return 'opera10a'; // use e.stacktrace
                }
                // e.stacktrace && e.stack -> opera10b
                if (e.stacktrace.indexOf("called from line") < 0) {
                    return 'opera10b'; // use e.stacktrace, format differs from 'opera10a'
                }
                // e.stacktrace && e.stack -> opera11
                return 'opera11'; // use e.stacktrace, format differs from 'opera10a', 'opera10b'
            } else if (e.stack) {
                return 'firefox';
            }
            return 'other';
        }

        /**
         * Given a context, function name, and callback function, overwrite it so that it calls
         * printStackTrace() first with a callback and then runs the rest of the body.
         *
         * @param {Object} context of execution (e.g. window)
         * @param {String} functionName to instrument
         * @param {Function} function to call with a stack trace on invocation
         */
        instrumentFunction(context, functionName, callback) {
            context = context || window;
            var original = context[functionName];
            context[functionName] = function instrumented() {
                callback.call(this, new PrintStackTrace().Result().slice(4));
                return context[functionName]._instrumented.apply(this, arguments);
            };
            context[functionName]._instrumented = original;
        }

        /**
         * Given a context and function name of a function that has been
         * instrumented, revert the function to it's original (non-instrumented)
         * state.
         *
         * @param {Object} context of execution (e.g. window)
         * @param {String} functionName to de-instrument
         */
        deinstrumentFunction(context, functionName) {
            if (context[functionName].constructor === Function &&
                    context[functionName]._instrumented &&
                    context[functionName]._instrumented.constructor === Function) {
                context[functionName] = context[functionName]._instrumented;
            }
        }

        /**
         * Given an Error object, return a formatted Array based on Chrome's stack string.
         *
         * @param e - Error object to inspect
         * @return Array<String> of function calls, files and line numbers
         */
        chrome(e) {
            var stack = (e.stack + '\n').replace(/^\S[^\(]+?[\n$]/gm, '').
              replace(/^\s+(at eval )?at\s+/gm, '').
              replace(/^([^\(]+?)([\n$])/gm, '{anonymous}()@$1$2').
              replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}()@$1').split('\n');
            stack.pop();
            return stack;
        }

        /**
         * Given an Error object, return a formatted Array based on Safari's stack string.
         *
         * @param e - Error object to inspect
         * @return Array<String> of function calls, files and line numbers
         */
        safari(e) {
            return e.stack.replace(/\[native code\]\n/m, '')
                .replace(/^(?=\w+Error\:).*$\n/m, '')
                .replace(/^@/gm, '{anonymous}()@')
                .split('\n');
        }

        /**
         * Given an Error object, return a formatted Array based on IE's stack string.
         *
         * @param e - Error object to inspect
         * @return Array<String> of function calls, files and line numbers
         */
        ie(e) {
            var lineRE = /^.*at (\w+) \(([^\)]+)\)$/gm;
            return e.stack.replace(/at Anonymous function /gm, '{anonymous}()@')
                .replace(/^(?=\w+Error\:).*$\n/m, '')
                .replace(lineRE, '$1@$2')
                .split('\n');
        }

        /**
         * Given an Error object, return a formatted Array based on Firefox's stack string.
         *
         * @param e - Error object to inspect
         * @return Array<String> of function calls, files and line numbers
         */
        firefox(e) {
            return e.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^[\(@]/gm, '{anonymous}()@').split('\n');
        }

        opera11(e) {
            var ANON = '{anonymous}', lineRE = /^.*line (\d+), column (\d+)(?: in (.+))? in (\S+):$/;
            var lines = e.stacktrace.split('\n'), result = [];

            for (var i = 0, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    var location = match[4] + ':' + match[1] + ':' + match[2];
                    var fnName = match[3] || "global code";
                    fnName = fnName.replace(/<anonymous function: (\S+)>/, "$1").replace(/<anonymous function>/, ANON);
                    result.push(fnName + '@' + location + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
                }
            }

            return result;
        }

        opera10b(e) {
            // "<anonymous function: run>([arguments not available])@file://localhost/G:/js/stacktrace.js:27\n" +
            // "printStackTrace([arguments not available])@file://localhost/G:/js/stacktrace.js:18\n" +
            // "@file://localhost/G:/js/test/functional/testcase1.html:15"
            var lineRE = /^(.*)@(.+):(\d+)$/;
            var lines = e.stacktrace.split('\n'), result = [];

            for (var i = 0, len = lines.length; i < len; i++) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    var fnName = match[1] ? (match[1] + '()') : "global code";
                    result.push(fnName + '@' + match[2] + ':' + match[3]);
                }
            }

            return result;
        }

        /**
         * Given an Error object, return a formatted Array based on Opera 10's stacktrace string.
         *
         * @param e - Error object to inspect
         * @return Array<String> of function calls, files and line numbers
         */
        opera10a(e) {
            // "  Line 27 of linked script file://localhost/G:/js/stacktrace.js\n"
            // "  Line 11 of inline#1 script in file://localhost/G:/js/test/functional/testcase1.html: In function foo\n"
            var ANON = '{anonymous}', lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
            var lines = e.stacktrace.split('\n'), result = [];

            for (var i = 0, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    var fnName = match[3] || ANON;
                    result.push(fnName + '()@' + match[2] + ':' + match[1] + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
                }
            }

            return result;
        }

        // Opera 7.x-9.2x only!
        opera9(e) {
            // "  Line 43 of linked script file://localhost/G:/js/stacktrace.js\n"
            // "  Line 7 of inline#1 script in file://localhost/G:/js/test/functional/testcase1.html\n"
            var ANON = '{anonymous}', lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
            var lines = e.message.split('\n'), result = [];

            for (var i = 2, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(ANON + '()@' + match[2] + ':' + match[1] + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
                }
            }

            return result;
        }

        // Safari 5-, IE 9-, and others
        other(curr) {
            var ANON = '{anonymous}', fnRE = /function\s*([\w\-$]+)?\s*\(/i, stack = [], fn, args, maxStackSize = 10;
            while (curr && curr['arguments'] && stack.length < maxStackSize) {
                fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
                args = Array.prototype.slice.call(curr['arguments'] || []);
                stack[stack.length] = fn + '(' + this.stringifyArguments(args) + ')';
                curr = curr.caller;
            }
            return stack;
        }

        /**
         * Given arguments array as a String, subsituting type names for non-string types.
         *
         * @param {Arguments} args
         * @return {Array} of Strings with stringified arguments
         */
        stringifyArguments(args) {
            var result = [];
            var slice = Array.prototype.slice;
            for (var i = 0; i < args.length; ++i) {
                var arg = args[i];
                if (arg === undefined) {
                    result[i] = 'undefined';
                } else if (arg === null) {
                    result[i] = 'null';
                } else if (arg.constructor) {
                    if (arg.constructor === Array) {
                        if (arg.length < 3) {
                            result[i] = '[' + this.stringifyArguments(arg) + ']';
                        } else {
                            result[i] = '[' + this.stringifyArguments(slice.call(arg, 0, 1)) + '...' + this.stringifyArguments(slice.call(arg, -1)) + ']';
                        }
                    } else if (arg.constructor === Object) {
                        result[i] = '#object';
                    } else if (arg.constructor === Function) {
                        result[i] = '#function';
                    } else if (arg.constructor === String) {
                        result[i] = '"' + arg + '"';
                    } else if (arg.constructor === Number) {
                        result[i] = arg;
                    }
                }
            }
            return result.join(',');
        }

        sourceCache: {};

        /**
         * @return the text from a given URL
         */
        ajax(url) {
            var req = this.createXMLHTTPObject();
            if (req) {
                try {
                    req.open('GET', url, false);
                    //req.overrideMimeType('text/plain');
                    //req.overrideMimeType('text/javascript');
                    req.send(null);
                    //return req.status == 200 ? req.responseText : '';
                    return req.responseText;
                } catch (e) {
                }
            }
            return '';
        }

        /**
         * Try XHR methods in order and store XHR factory.
         *
         * @return <Function> XHR function or equivalent
         */
        createXMLHTTPObject() {
            var xmlhttp, XMLHttpFactories = [
                function () {
                    return new XMLHttpRequest();
                }, function () {
                    return new ActiveXObject('Msxml2.XMLHTTP');
                }, function () {
                    return new ActiveXObject('Msxml3.XMLHTTP');
                }, function () {
                    return new ActiveXObject('Microsoft.XMLHTTP');
                }
            ];
            for (var i = 0; i < XMLHttpFactories.length; i++) {
                try {
                    xmlhttp = XMLHttpFactories[i]();
                    // Use memoization to cache the factory
                    this.createXMLHTTPObject = XMLHttpFactories[i];
                    return xmlhttp;
                } catch (e) {
                }
            }
        }

        /**
         * Given a URL, check if it is in the same domain (so we can get the source
         * via Ajax).
         *
         * @param url <String> source url
         * @return False if we need a cross-domain request
         */
        isSameDomain(url) {
            return typeof location !== "undefined" && url.indexOf(location.hostname) !== -1; // location may not be defined, e.g. when running from nodejs.
        }

        /**
         * Get source code from given URL if in the same domain.
         *
         * @param url <String> JS source URL
         * @return <Array> Array of source code lines
         */
        getSource(url) {
            // TODO reuse source from script tags?
            if (!(url in this.sourceCache)) {
                this.sourceCache[url] = this.ajax(url).split('\n');
            }
            return this.sourceCache[url];
        }

        guessAnonymousFunctions(stack) {
            for (var i = 0; i < stack.length; ++i) {
                var reStack = /\{anonymous\}\(.*\)@(.*)/,
                    reRef = /^(.*?)(?::(\d+))(?::(\d+))?(?: -- .+)?$/,
                    frame = stack[i], ref = reStack.exec(frame);

                if (ref) {
                    var m = reRef.exec(ref[1]);
                    if (m) { // If falsey, we did not get any file/line information
                        var file = m[1], lineno = m[2], charno = m[3] || 0;
                        if (file && this.isSameDomain(file) && lineno) {
                            var functionName = this.guessAnonymousFunction(file, lineno, charno);
                            stack[i] = frame.replace('{anonymous}', functionName);
                        }
                    }
                }
            }
            return stack;
        }

        guessAnonymousFunction(url, lineNo, charNo) {
            var ret;
            try {
                ret = this.findFunctionName(this.getSource(url), lineNo);
            } catch (e) {
                ret = 'getSource failed with url: ' + url + ', exception: ' + e.toString();
            }
            return ret;
        }

        findFunctionName(source, lineNo) {
            // FIXME findFunctionName fails for compressed source
            // (more than one function on the same line)
            // function {name}({args}) m[1]=name m[2]=args
            var reFunctionDeclaration = /function\s+([^(]*?)\s*\(([^)]*)\)/;
            // {name} = function ({args}) TODO args capture
            // /['"]?([0-9A-Za-z_]+)['"]?\s*[:=]\s*function(?:[^(]*)/
            var reFunctionExpression = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;
            // {name} = eval()
            var reFunctionEvaluation = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;
            // Walk backwards in the source lines until we find
            // the line which matches one of the patterns above
            var code = "", line, maxLines = Math.min(lineNo, 20), m, commentPos;
            for (var i = 0; i < maxLines; ++i) {
                // lineNo is 1-based, source[] is 0-based
                line = source[lineNo - i - 1];
                commentPos = line.indexOf('//');
                if (commentPos >= 0) {
                    line = line.substr(0, commentPos);
                }
                // TODO check other types of comments? Commented code may lead to false positive
                if (line) {
                    code = line + code;
                    m = reFunctionExpression.exec(code);
                    if (m && m[1]) {
                        return m[1];
                    }
                    m = reFunctionDeclaration.exec(code);
                    if (m && m[1]) {
                        //return m[1] + "(" + (m[2] || "") + ")";
                        return m[1];
                    }
                    m = reFunctionEvaluation.exec(code);
                    if (m && m[1]) {
                        return m[1];
                    }
                }
            }
            return '(?)';
        }
    }


    class JSONStringifySafe {
        getSerialize(fn, decycle?) {
            var seen = [];
            decycle = decycle || function (key, value) {
                return '[Circular]';
            };
            return function (key, value) {
                var ret = value;
                if (typeof value === 'object' && value) {
                    if (seen.indexOf(value) !== -1) {
                        ret = decycle(key, value);
                    }
                    else {
                        seen.push(value);
                    }
                }
                if (fn) {
                    ret = fn(key, ret);
                }
                return ret;
            }
        }

        stringify(obj, fn, spaces:number, decycle?) {
            return JSON.stringify(obj, this.getSerialize(fn, decycle), spaces);
        }
    }



    Logger.JLoggrInstance = new JLoggrBase();
}

// create public instance variable for logger
var log = new JLoggr.Logger();
