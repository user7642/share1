//file:///home/trvndng/Videos/
doc = document.querySelector("#tbody");
var key = 'videoplaylist';

var tr = doc.querySelectorAll("tr");
a = []; 
m = {};
for (i=0;i<tr.length;i++){
    e  = tr[i];
    name = tr[i].cells[0].innerText;
    link = tr[i].cells[0].children[0].href;
    size = tr[i].cells[1].attributes[1].value
    m.name = name
    console.log(name,link,size)
    a.push({name : name, link : link, size : size})

}

localStorage.setItem("videoplaylist", JSON.stringify(a));

console.log(JSON.stringify(a).join("/n"))
