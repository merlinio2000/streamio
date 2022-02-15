function doAction(actionStr) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            document.getElementById("player-response").innerText = this.responseText;
        }
    };
    xmlhttp.open("GET", "control?action=" + actionStr.toLowerCase(), true);
    xmlhttp.send();
}