
window.addEventListener("load", function () {
    const loader = document.getElementById("qa-loader");
    if(loader){
        setTimeout(()=>loader.classList.add("hidden"),400);
    }
});
