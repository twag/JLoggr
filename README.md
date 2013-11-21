JLoggr - Simple Javascript Logging Component
==================================================

A simple javascript logger, designed to be an improvement to using alert() or logging to the browser console.


It is based on:

      Blackbird - http://www.gscottolson.com/blackbirdjs/
      javascript-stacktrace - https://github.com/eriwen/javascript-stacktrace
      json-stringify-safe - https://github.com/isaacs/json-stringify-safe


And written/converted to Typescript.



Setup
==================================================
Just include jsloggr.js and jsloggr.css on your page


    <html>
      <head>
        <script type="text/javascript" src="/PATH/TO/jsloggr.js"></script>
        <link type="text/css" rel="Stylesheet" href="/PATH/TO/jsloggr.css" />
        ...
      </head>
    
    ...


If you are using typescript, just include the JSLoggr.ts as a reference to your typescript file, in addition to above.



Usage
==================================================


Output all message types
------------------------

    log.debug( 'this is a debug message' );
    log.info( 'this is an info message' );
    log.warn( 'this is a warning message' );
    log.error( 'this is an error message' );


Generate test string
------------------------
    log.profile( 'generate test string' );
    
    var testContent = '';
    for ( var i = 0; i < 3000; i++ ) {
      testContent += '-';
    }
    
    log.profile( 'generate test string' );



Create a logger for each class (using Typescript)
------------------------------
This is a way keep track of what log messages are coming from what class


        /// <reference path="/PATH/TO/JLoggr.ts" />
        class ExampleViewModel {
          log = new JLoggr.Logger("ExampleViewModel");

          SomeMethod() {
             this.log.info("Calling SomeMethod()");
          }
        }


Capturing a stack trace
-----------------------

        try {
            // do something that doesn't work here
        }
        catch (ex) {
            log.error("There was an error");
            log.stackTrace(ex);
        }


Logging the contents of an object
---------------------------------

        var someObject= {
            name: 'Some Object',           
            id: 92832828,
            state: 'Arkansas'
        };

        log.object(options);


API
==================================================
* **log.toggle()**  
Hide/show log window

* **log.move()**  
Move to next fixed positions: top-left, top-right, bottom-left, bottom-right

* **log.resize()**  
Expand/contract

* **log.clear()**  
Clear all contents

* **log.debug( message )**  
Add a debug message

* **log.info( message )**  
Add an info message

* **log.warn( message )**  
Add a warning message

* **log.error( message )**  
Add an error message

* **log.object( object )**  
Log Contents of an object

* **log.stackTrace( ex )**  
Log Contents of a stack trace

* **log.profile( label )**  
Start/end a time profiler. If a profiler named string does not exist, create a new profiler. Otherwise, stop the profiler string and display the time elapsed (in ms).


Keyboard Commands
==================================================

* Hide/Show - **F2**
* Move - **SHIFT + F2**
* Clear - **ALT + SHIFT + F2**

