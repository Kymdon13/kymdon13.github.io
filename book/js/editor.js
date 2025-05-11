"use strict";
window.editors = [];
(function (editors) {
    if (typeof (ace) === 'undefined' || !ace) {
        return;
    }
    ace.require("ace/ext/language_tools");
    Array.from(document.querySelectorAll('.editable')).forEach(function (editable) {
        let display_line_numbers = window.playground_line_numbers || false;

        // create a ace editor instance for current editable element
        let editor = ace.edit(editable);
        editor.setOptions({
            highlightActiveLine: false,
            showPrintMargin: false,
            showLineNumbers: display_line_numbers,
            showGutter: display_line_numbers,
            maxLines: Infinity,
            fontSize: "0.875em" // please adjust the font size of the code in general.css
        });

        editor.$blockScrolling = Infinity;

        /* set mode for each language, yeah it's dumb */
        if (editable.classList.contains('language-cpp')) {
            editor.session.setMode("ace/mode/c_cpp");
        } else if (editable.classList.contains('language-rust')) {
            editor.session.setMode("ace/mode/rust");
        }

        /* for cli or run to get the original code */
        editor.originalCode = editor.getValue();

        /* for auto completion */
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true,
            enableSnippets: true
        });

        editors.push(editor);
    });
})(window.editors);
