function PCDisable(e)
{  if(!document.PCDisable) // initialize
  {
    if(document.layers) 
    { document.captureEvents(Event.MOUSEDOWN); document.onmousedown =PCDisable;   }
    else {document.oncontextmenu =PCDisable;};
    return document.PCDisable= true;
  }
  if(document.layers || (document.getElementById && !document.all))
  {  if (e.which==2||e.which==3){return false; }}
  else
  {  return false;}
}
PCDisable();
