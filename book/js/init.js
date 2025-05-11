/* XXX(Kymdon13) add <pre class="playground"> as the father of <code> so that it can display the "play" button */
if (!window.initJSLoaded) { // this is to prevent the script from running multiple times
    /* attribute: playground is to enable the `run` and `undo` buttons in the code block */
    document.querySelectorAll('pre code').forEach(block => {
        /* editable is runnable by default */
        if (block.classList.contains('run') || block.classList.contains('editable')) {
            block.parentElement.classList.add('playground');
        }
    });
    document.querySelectorAll("code.language-cpp.editable").forEach(code => {
        /* add pre as the outer wrapper */
        const top_pre = document.createElement("pre");
        // replaceChild(newNode, oldNode) replaces the oldNode with newNode
        code.parentNode.parentNode.replaceChild(top_pre, code.parentNode);
        top_pre.appendChild(code.parentNode);

        /* remove the wrongly appeared line break */
        // code.innerHTML = code.innerHTML.replace(/^\n/, ''); // remove the first line break if you have to
        code.innerHTML = code.innerHTML.replace(/\n$/, '');
    });
    window.initJSLoaded = true;
}
