$(async function()
{
    jax("https://api.github.com/users/yaoqs/repos",
    await function (dataString) {
            /*var div2 = document.querySelector("#reposshow");
            var ol=document.createElement('ol');
            for (var rep of dataString) {
                //console.log(rep.name);
                var li=document.createElement('li');
                var i = document.createElement('a');
                i.href = "https://yaoqs.github.io/" + rep.name;
                i.target = "_blank";
                i.innerText = rep.full_name;
                li.appendChild(i);
                if(rep.forks_count>0)
                {
                    $("<img src='https://img.shields.io/github/forks/"+rep.full_name+"' style='padding-left:1em;'/>").appendTo(li);
                }
                if(rep.stargazers_count>0)
                {
                    $("<img src='https://img.shields.io/github/stars/"+rep.full_name+"' style='padding-left:1em;'/>").appendTo(li);
                }
                ol.appendChild(li);
                if(rep.description){
                    $("<span>Description:   <a href="+rep.html_url+">"+rep.description+"</a></span><br>").appendTo(ol);
                }
                $("<span>clone_url: <a href="+rep.clone_url+">"+rep.clone_url+"</a></span>").appendTo(ol);
                $("<br><span>size:"+rep.size+"</span>").appendTo(ol);
            }
            div2.appendChild(ol);*/
            var li=d3.select("body").select("#reposshow").append("ol").selectAll("li").data(dataString).enter().append("li");
            li.append("a").text((a)=>{return a.full_name}).attr({"target":"_blank","href":(rep)=>{return "https://yaoqs.github.io/" + rep.name}});
            li.append("img").attr("src",(rep)=>{return "https://img.shields.io/github/forks/"+rep.full_name}).style("padding-left","1em");
            li.append("img").attr("src",(rep)=>{return "https://img.shields.io/github/stars/"+rep.full_name}).style("padding-left","1em");
            li.append("br");
            li.append("span").text("Description:").append("a").text((rep)=>{return rep.description}).attr("href",(rep)=>{return rep.html_url});
            li.append("br");
            li.append("span").text("clone_url:   ").append("a").text((rep)=>{return rep.clone_url}).attr("href",(rep)=>{return rep.clone_url});
            li.append("br");
            li.append("span").text((rep)=>{return "updated_at:"+rep.updated_at});
        })
});