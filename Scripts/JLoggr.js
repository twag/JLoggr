var JLoggr;
(function (JLoggr) {
    var JLoggrState = (function () {
        function JLoggrState() {
            this.load = false;
            this.pos = 1;
            this.size = 0;
        }
        return JLoggrState;
    })();
    JLoggr.JLoggrState = JLoggrState;

    var JLoggrBase = (function () {
        function JLoggrBase() {
            var _this = this;
            this.IE6_POSITION_FIXED = true;
            this.JLoggrCookieName = "JLoggrSettings";
            this.cache = [];
            this.classes = {};
            this.profiler = {};
            this.IDs = {
                JLoggr: 'JLoggr',
                checkbox: 'bbVis',
                filters: 'bbFilters',
                controls: 'bbControls',
                size: 'bbSize'
            };
            this.messageTypes = {
                debug: true,
                info: true,
                warn: true,
                error: true,
                profile: true
            };
            this.state = this.getState();

            $(function () {
                _this.onLoad();
            });
        }
        JLoggrBase.prototype.generateMarkup = function () {
            var spans = [];
            for (var type in this.messageTypes) {
                spans.push(['<span class="', type, '" type="', type, '"></span>'].join(''));
            }

            var newNode = document.createElement('DIV');
            newNode.id = this.IDs.JLoggr;
            newNode.style.display = 'none';
            JLoggr;
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
                '</div>',
                '<div class="" style="padding:5px;background:#d9edf6;overflow:hidden;">',
                '<div id="',
                this.IDs.controls,
                '" class="controls">',
                '<div class="pull-left">',
                '<div class="btn-group"><a href="#" class="btn btn-small" id="',
                this.IDs.size,
                '" title="contract" op="resize">Resize</a>',
                '<a href="#" class="btn btn-small" id="',
                this.IDs.size,
                '" title="contract" op="resize">Full</a></div>',
                '&nbsp;<a href="#" class="btn btn-small" op="clear">Clear</a>',
                '&nbsp;<a href="#" class="btn btn-small" op="move">Move</a>',
                '</div><div class="pull-right">',
                '&nbsp;<a href="#" class="btn btn-small" op="close">Close</a>',
                '</div></div>',
                '</div>',
                '</div>',
                '<div class="JLoggr-main">',
                '<div class="JLoggr-left"></div><div class="JLoggr-mainBody">',
                '<ol>',
                this.cache.join(''),
                '</ol>',
                '</div><div class="JLoggr-right"></div>',
                '</div>',
                '<div class="" style="background:#3f3f3f;padding:5px;color:#fe9516;">',
                '<div class="JLoggr-left"><label for="',
                this.IDs.checkbox,
                '"><input type="checkbox" id="',
                this.IDs.checkbox,
                '" />&nbsp;Visible on page load</label></div>',
                '<div class="JLoggr-right"></div>',
                '</div>'
            ].join('');
            return newNode;
        };

        JLoggrBase.prototype.backgroundImage = function () {
            var bodyTag = document.getElementsByTagName('BODY')[0];

            if (bodyTag.currentStyle && this.IE6_POSITION_FIXED) {
                if (bodyTag.currentStyle.backgroundImage == 'none') {
                    bodyTag.style.backgroundImage = 'url(about:blank)';
                }
                if (bodyTag.currentStyle.backgroundAttachment == 'scroll') {
                    bodyTag.style.backgroundAttachment = 'fixed';
                }
            }
        };

        JLoggrBase.prototype.addMessage = function (type, content, caller) {
            if (this.outputList) {
                var newMsg = document.createElement('LI');
                newMsg.className = type;
                newMsg.innerHTML = [type, caller, content].join(' | ');
                this.outputList.appendChild(newMsg);
                this.scrollToBottom();
            } else {
                this.cache.push(['<li class="', type, '">', type + " | " + caller + " | ", content, '</li>'].join(''));
            }
        };

        JLoggrBase.prototype.clear = function () {
            this.outputList.innerHTML = '';
        };

        JLoggrBase.prototype.clickControl = function (evt) {
            if (!evt)
                evt = window.event;
            var el = (evt.target) ? evt.target : evt.srcElement;
            if (el.tagName == 'A') {
                switch (el.getAttributeNode('op').nodeValue) {
                    case 'resize':
                        this.resize();
                        break;
                    case 'clear':
                        this.clear();
                        break;
                    case 'move':
                        this.reposition();
                        break;
                    case 'close':
                        this.hide();
                        break;
                }
            }
        };

        JLoggrBase.prototype.clickFilter = function (evt) {
            if (!evt)
                evt = window.event;
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
                        var spanType = (filters[i]).getAttributeNode('type').nodeValue;

                        (filters[i]).className = (oneActiveFilter || (spanType == type)) ? spanType : spanType + 'Disabled';
                        this.messageTypes[spanType] = oneActiveFilter || (spanType == type);
                    }
                } else {
                    this.messageTypes[type] = !this.messageTypes[type];
                    span.className = (this.messageTypes[type]) ? type : type + 'Disabled';
                }

                var disabledTypes = [];
                for (type in this.messageTypes) {
                    if (!this.messageTypes[type])
                        disabledTypes.push(type);
                }
                disabledTypes.push('');
                this.outputList.className = disabledTypes.join('Hidden ');

                this.scrollToBottom();
            }
        };

        JLoggrBase.prototype.clickVis = function (evt) {
            if (!evt)
                evt = window.event;
            var el = (evt.target) ? evt.target : evt.srcElement;

            this.state.load = el.checked;
            this.setState();
        };

        JLoggrBase.prototype.scrollToBottom = function () {
            this.outputList.scrollTop = this.outputList.scrollHeight;
        };

        JLoggrBase.prototype.isVisible = function () {
            return (this.JLoggr.style.display == 'block');
        };

        JLoggrBase.prototype.hide = function () {
            this.JLoggr.style.display = 'none';
        };

        JLoggrBase.prototype.show = function () {
            var body = document.getElementsByTagName('BODY')[0];

            body.removeChild(this.JLoggr);
            body.appendChild(this.JLoggr);
            this.JLoggr.style.display = 'block';
        };

        JLoggrBase.prototype.reposition = function (position) {
            if (position === undefined || position == null) {
                position = (this.state && this.state.pos === null) ? 1 : (this.state.pos + 1) % 4;
            }

            switch (position) {
                case 0:
                    this.classes[0] = 'bbTopLeft';
                    break;
                case 1:
                    this.classes[0] = 'bbTopRight';
                    break;
                case 2:
                    this.classes[0] = 'bbBottomLeft';
                    break;
                case 3:
                    this.classes[0] = 'bbBottomRight';
                    break;
            }
            this.state.pos = position;
            this.setState();
        };

        JLoggrBase.prototype.resize = function (size) {
            if (size === undefined || size === null) {
                size = (this.state && this.state.size == null) ? 0 : (this.state.size + 1) % 2;
            }

            this.classes[1] = (size === 0) ? 'bbSmall' : 'bbLarge';

            var span = document.getElementById(this.IDs.size);
            span.title = (size === 1) ? 'small' : 'large';
            span.className = span.title + " btn btn-small";

            this.state.size = size;
            this.setState();
            this.scrollToBottom();
        };

        JLoggrBase.prototype.setCookie = function (c_name, value, exdays) {
            var exdate = new Date();
            exdate.setDate(exdate.getDate() + exdays);
            var c_value = encodeURI(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
            document.cookie = c_name + "=" + c_value;
        };

        JLoggrBase.prototype.getCookie = function (c_name) {
            var i, x, y, ARRcookies = document.cookie.split(";");
            for (i = 0; i < ARRcookies.length; i++) {
                x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
                y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
                x = x.replace(/^\s+|\s+$/g, "");
                if (x == c_name) {
                    return decodeURI(y);
                }
            }
        };

        JLoggrBase.prototype.setState = function () {
            try  {
                var props = [];

                this.setCookie(this.JLoggrCookieName, JSON.stringify(this.state), 14);

                var newClass = [];
                for (var word in this.classes) {
                    newClass.push(this.classes[word]);
                }
                this.JLoggr.className = newClass.join(' ');
            } catch (e) {
                log.error("can't set state: " + e);
            }
        };

        JLoggrBase.prototype.getState = function () {
            var value = this.getCookie(this.JLoggrCookieName);

            if (value != undefined) {
                try  {
                    return JSON.parse(value);
                } catch (e) {
                    this.setCookie(this.JLoggrCookieName, JSON.stringify(new JLoggrState()), 14);
                }
            }

            return new JLoggrState();
        };

        JLoggrBase.prototype.readKey = function (eventObject) {
            var code = 113;

            if (eventObject.which == code) {
                var visible = this.isVisible();

                var shiftKey = eventObject.shiftKey;
                var altKey = eventObject.altKey;

                if (visible && shiftKey && altKey) {
                    this.clear();
                } else if (visible && shiftKey) {
                    this.reposition();
                } else if (!shiftKey && !altKey) {
                    (visible) ? this.hide() : this.show();
                }
            }
        };

        JLoggrBase.prototype.addEvent = function (obj, type, fn) {
            var obj = (obj.constructor === String) ? document.getElementById(obj) : obj;
            if (obj.attachEvent) {
                obj['e' + type + fn] = fn;
                obj[type + fn] = function () {
                    obj['e' + type + fn](window.event);
                };
                obj.attachEvent('on' + type, obj[type + fn]);
            } else
                obj.addEventListener(type, fn, false);
        };

        JLoggrBase.prototype.removeEvent = function (obj, type, fn) {
            var obj = (obj.constructor === String) ? document.getElementById(obj) : obj;
            if (obj.detachEvent) {
                obj.detachEvent('on' + type, obj[type + fn]);
                obj[type + fn] = null;
            } else
                obj.removeEventListener(type, fn, false);
        };

        JLoggrBase.prototype.onLoad = function () {
            var _this = this;
            try  {
                var body = document.getElementsByTagName('BODY')[0];

                var element = this.generateMarkup();

                this.JLoggr = body.appendChild(element);
                this.outputList = this.JLoggr.getElementsByTagName('OL')[0];

                this.backgroundImage();

                $("#" + this.IDs.checkbox).click(function (eventObject) {
                    _this.clickVis(eventObject);
                });
                $("#" + this.IDs.filters).click(function (eventObject) {
                    _this.clickFilter(eventObject);
                });
                $("#" + this.IDs.controls).click(function (eventObject) {
                    _this.clickControl(eventObject);
                });
                $(document).keyup(function (eventObject) {
                    _this.readKey(eventObject);
                });

                this.resize(this.state.size);
                this.reposition(this.state.pos);
                if (this.state.load) {
                    this.show();
                    (document.getElementById(this.IDs.checkbox)).checked = true;
                }

                this.scrollToBottom();

                this.addEvent(window, 'unload', function () {
                });
            } catch (err) {
                alert("Error in onLoad: " + err);
            }
        };
        return JLoggrBase;
    })();
    JLoggr.JLoggrBase = JLoggrBase;

    var Logger = (function () {
        function Logger(source) {
            this.source = "?";
            this.JQueryAjaxLogger = function (jqXHR, textStatus, errorThrow) {
                Logger.JLoggrInstance.addMessage('Error', "JQuery Ajax Error<br>Status: " + textStatus + "<br> Error:" + errorThrow);
                var stringifySafe = new JSONStringifySafe();
                var objString = stringifySafe.stringify(jqXHR, null, 2);
                Logger.JLoggrInstance.addMessage('Error', objString);
            };
            try  {
                if (source != undefined) {
                    this.source = source;
                }
            } catch (err) {
                alert("Error in Logger(): " + err);
            }
        }
        Logger.prototype.init = function () {
            Logger.JLoggrInstance.show();
            this.error('<b>Log</b> can only be initialized once');
        };

        Logger.prototype.toggle = function () {
            (Logger.JLoggrInstance.isVisible()) ? Logger.JLoggrInstance.hide() : Logger.JLoggrInstance.show();
        };
        Logger.prototype.resize = function () {
            Logger.JLoggrInstance.resize();
        };
        Logger.prototype.clear = function () {
            Logger.JLoggrInstance.clear();
        };
        Logger.prototype.move = function () {
            Logger.JLoggrInstance.reposition();
        };
        Logger.prototype.debug = function (msg) {
            Logger.JLoggrInstance.addMessage('debug', msg, this.source);
        };
        Logger.prototype.warn = function (msg) {
            Logger.JLoggrInstance.addMessage('warn', msg, this.source);
        };
        Logger.prototype.info = function (msg) {
            Logger.JLoggrInstance.addMessage('info', msg, this.source);
        };
        Logger.prototype.error = function (msg) {
            Logger.JLoggrInstance.addMessage('error', msg, this.source);
        };

        Logger.prototype.stackTrace = function (err) {
            try  {
                var pst = new PrintStackTrace(new PrintStackTraceOptions(err));
                Logger.JLoggrInstance.addMessage('trace', pst.Result().join('<br>'));
            } catch (err) {
            }
        };

        Logger.prototype.object = function (obj) {
            try  {
                var stringifySafe = new JSONStringifySafe();
                var objString = stringifySafe.stringify(obj, null, 2);
                Logger.JLoggrInstance.addMessage('object', objString, this.source);
            } catch (err) {
                Logger.JLoggrInstance.addMessage('object', "Can't represent object: " + err, this.source);
            }
        };

        Logger.prototype.profile = function (label) {
            var currentTime = new Date();

            if (label == undefined || label == '') {
                Logger.JLoggrInstance.addMessage('error', '<b>ERROR:</b> Please specify a label for your profile statement');
            } else if (Logger.JLoggrInstance.profiler[label]) {
                delete Logger.JLoggrInstance.profiler[label];
            } else {
                Logger.JLoggrInstance.profiler[label] = currentTime;
                Logger.JLoggrInstance.addMessage('profile', label);
            }
            return currentTime;
        };
        return Logger;
    })();
    JLoggr.Logger = Logger;

    var PrintStackTraceOptions = (function () {
        function PrintStackTraceOptions(e) {
            this.guess = true;
            this.e = e;

            if (e != undefined) {
                this.guess = false;
            }
        }
        return PrintStackTraceOptions;
    })();
    JLoggr.PrintStackTraceOptions = PrintStackTraceOptions;

    var PrintStackTrace = (function () {
        function PrintStackTrace(options) {
            try  {
                if (options == undefined) {
                    this.options = new PrintStackTraceOptions();
                    this.ex = undefined;
                    this.guess = true;
                } else {
                    this.options = options;
                    this.ex = options.e || null;
                    this.guess = !!options.guess;
                }
                this.p = new PrintStackTraceImplementation();
                this.result = this.p.run(this.ex);
            } catch (err) {
                log.error("printStackTrace() error: " + err);
            }
        }
        PrintStackTrace.prototype.Result = function () {
            return (this.guess) ? this.p.guessAnonymousFunctions(this.result) : this.result;
        };
        return PrintStackTrace;
    })();

    var PrintStackTraceImplementation = (function () {
        function PrintStackTraceImplementation() {
        }
        PrintStackTraceImplementation.prototype.undef = function () {
            return undefined;
        };

        PrintStackTraceImplementation.prototype.run = function (ex, mode) {
            if (ex == undefined) {
                ex = this.createException();
            }

            if (mode == undefined) {
                mode = this.mode(ex);
            }

            if (mode === 'other') {
                return this.other(arguments.callee);
            } else {
                return this[mode](ex);
            }
        };

        PrintStackTraceImplementation.prototype.createException = function () {
            try  {
                this.undef();
            } catch (e) {
                return e;
            }
        };

        PrintStackTraceImplementation.prototype.mode = function (e) {
            var win = window;
            if (e['arguments'] && e.stack) {
                return 'chrome';
            } else if (e.stack && e.sourceURL) {
                return 'safari';
            } else if (e.stack && e.number) {
                return 'ie';
            } else if (typeof e.message === 'string' && typeof window !== 'undefined' && win.opera) {
                if (!e.stacktrace) {
                    return 'opera9';
                }

                if (e.message.indexOf('\n') > -1 && e.message.split('\n').length > e.stacktrace.split('\n').length) {
                    return 'opera9';
                }

                if (!e.stack) {
                    return 'opera10a';
                }

                if (e.stacktrace.indexOf("called from line") < 0) {
                    return 'opera10b';
                }

                return 'opera11';
            } else if (e.stack) {
                return 'firefox';
            }
            return 'other';
        };

        PrintStackTraceImplementation.prototype.instrumentFunction = function (context, functionName, callback) {
            context = context || window;
            var original = context[functionName];
            context[functionName] = function instrumented() {
                callback.call(this, new PrintStackTrace().Result().slice(4));
                return context[functionName]._instrumented.apply(this, arguments);
            };
            context[functionName]._instrumented = original;
        };

        PrintStackTraceImplementation.prototype.deinstrumentFunction = function (context, functionName) {
            if (context[functionName].constructor === Function && context[functionName]._instrumented && context[functionName]._instrumented.constructor === Function) {
                context[functionName] = context[functionName]._instrumented;
            }
        };

        PrintStackTraceImplementation.prototype.chrome = function (e) {
            var stack = (e.stack + '\n').replace(/^\S[^\(]+?[\n$]/gm, '').replace(/^\s+(at eval )?at\s+/gm, '').replace(/^([^\(]+?)([\n$])/gm, '{anonymous}()@$1$2').replace(/^Object.<anonymous>\s*\(([^\)]+)\)/gm, '{anonymous}()@$1').split('\n');
            stack.pop();
            return stack;
        };

        PrintStackTraceImplementation.prototype.safari = function (e) {
            return e.stack.replace(/\[native code\]\n/m, '').replace(/^(?=\w+Error\:).*$\n/m, '').replace(/^@/gm, '{anonymous}()@').split('\n');
        };

        PrintStackTraceImplementation.prototype.ie = function (e) {
            var lineRE = /^.*at (\w+) \(([^\)]+)\)$/gm;
            return e.stack.replace(/at Anonymous function /gm, '{anonymous}()@').replace(/^(?=\w+Error\:).*$\n/m, '').replace(lineRE, '$1@$2').split('\n');
        };

        PrintStackTraceImplementation.prototype.firefox = function (e) {
            return e.stack.replace(/(?:\n@:0)?\s+$/m, '').replace(/^[\(@]/gm, '{anonymous}()@').split('\n');
        };

        PrintStackTraceImplementation.prototype.opera11 = function (e) {
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
        };

        PrintStackTraceImplementation.prototype.opera10b = function (e) {
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
        };

        PrintStackTraceImplementation.prototype.opera10a = function (e) {
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
        };

        PrintStackTraceImplementation.prototype.opera9 = function (e) {
            var ANON = '{anonymous}', lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
            var lines = e.message.split('\n'), result = [];

            for (var i = 2, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(ANON + '()@' + match[2] + ':' + match[1] + ' -- ' + lines[i + 1].replace(/^\s+/, ''));
                }
            }

            return result;
        };

        PrintStackTraceImplementation.prototype.other = function (curr) {
            var ANON = '{anonymous}', fnRE = /function\s*([\w\-$]+)?\s*\(/i, stack = [], fn, args, maxStackSize = 10;
            while (curr && curr['arguments'] && stack.length < maxStackSize) {
                fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
                args = Array.prototype.slice.call(curr['arguments'] || []);
                stack[stack.length] = fn + '(' + this.stringifyArguments(args) + ')';
                curr = curr.caller;
            }
            return stack;
        };

        PrintStackTraceImplementation.prototype.stringifyArguments = function (args) {
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
        };

        PrintStackTraceImplementation.prototype.ajax = function (url) {
            var req = this.createXMLHTTPObject();
            if (req) {
                try  {
                    req.open('GET', url, false);

                    req.send(null);

                    return req.responseText;
                } catch (e) {
                }
            }
            return '';
        };

        PrintStackTraceImplementation.prototype.createXMLHTTPObject = function () {
            var xmlhttp, XMLHttpFactories = [
                function () {
                    return new XMLHttpRequest();
                },
                function () {
                    return new ActiveXObject('Msxml2.XMLHTTP');
                },
                function () {
                    return new ActiveXObject('Msxml3.XMLHTTP');
                },
                function () {
                    return new ActiveXObject('Microsoft.XMLHTTP');
                }
            ];
            for (var i = 0; i < XMLHttpFactories.length; i++) {
                try  {
                    xmlhttp = XMLHttpFactories[i]();

                    this.createXMLHTTPObject = XMLHttpFactories[i];
                    return xmlhttp;
                } catch (e) {
                }
            }
        };

        PrintStackTraceImplementation.prototype.isSameDomain = function (url) {
            return typeof location !== "undefined" && url.indexOf(location.hostname) !== -1;
        };

        PrintStackTraceImplementation.prototype.getSource = function (url) {
            if (!(url in this.sourceCache)) {
                this.sourceCache[url] = this.ajax(url).split('\n');
            }
            return this.sourceCache[url];
        };

        PrintStackTraceImplementation.prototype.guessAnonymousFunctions = function (stack) {
            for (var i = 0; i < stack.length; ++i) {
                var reStack = /\{anonymous\}\(.*\)@(.*)/, reRef = /^(.*?)(?::(\d+))(?::(\d+))?(?: -- .+)?$/, frame = stack[i], ref = reStack.exec(frame);

                if (ref) {
                    var m = reRef.exec(ref[1]);
                    if (m) {
                        var file = m[1], lineno = m[2], charno = m[3] || 0;
                        if (file && this.isSameDomain(file) && lineno) {
                            var functionName = this.guessAnonymousFunction(file, lineno, charno);
                            stack[i] = frame.replace('{anonymous}', functionName);
                        }
                    }
                }
            }
            return stack;
        };

        PrintStackTraceImplementation.prototype.guessAnonymousFunction = function (url, lineNo, charNo) {
            var ret;
            try  {
                ret = this.findFunctionName(this.getSource(url), lineNo);
            } catch (e) {
                ret = 'getSource failed with url: ' + url + ', exception: ' + e.toString();
            }
            return ret;
        };

        PrintStackTraceImplementation.prototype.findFunctionName = function (source, lineNo) {
            var reFunctionDeclaration = /function\s+([^(]*?)\s*\(([^)]*)\)/;

            var reFunctionExpression = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*function\b/;

            var reFunctionEvaluation = /['"]?([$_A-Za-z][$_A-Za-z0-9]*)['"]?\s*[:=]\s*(?:eval|new Function)\b/;

            var code = "", line, maxLines = Math.min(lineNo, 20), m, commentPos;
            for (var i = 0; i < maxLines; ++i) {
                line = source[lineNo - i - 1];
                commentPos = line.indexOf('//');
                if (commentPos >= 0) {
                    line = line.substr(0, commentPos);
                }

                if (line) {
                    code = line + code;
                    m = reFunctionExpression.exec(code);
                    if (m && m[1]) {
                        return m[1];
                    }
                    m = reFunctionDeclaration.exec(code);
                    if (m && m[1]) {
                        return m[1];
                    }
                    m = reFunctionEvaluation.exec(code);
                    if (m && m[1]) {
                        return m[1];
                    }
                }
            }
            return '(?)';
        };
        return PrintStackTraceImplementation;
    })();

    var JSONStringifySafe = (function () {
        function JSONStringifySafe() {
        }
        JSONStringifySafe.prototype.getSerialize = function (fn, decycle) {
            var seen = [];
            decycle = decycle || function (key, value) {
                return '[Circular]';
            };
            return function (key, value) {
                var ret = value;
                if (typeof value === 'object' && value) {
                    if (seen.indexOf(value) !== -1) {
                        ret = decycle(key, value);
                    } else {
                        seen.push(value);
                    }
                }
                if (fn) {
                    ret = fn(key, ret);
                }
                return ret;
            };
        };

        JSONStringifySafe.prototype.stringify = function (obj, fn, spaces, decycle) {
            return JSON.stringify(obj, this.getSerialize(fn, decycle), spaces);
        };
        return JSONStringifySafe;
    })();

    Logger.JLoggrInstance = new JLoggrBase();
})(JLoggr || (JLoggr = {}));

var log = new JLoggr.Logger();
//@ sourceMappingURL=JLoggr.js.map
