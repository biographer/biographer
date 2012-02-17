(function(bui){
   bui.layouter={};
   /* creates a string from the json data which serves as input for the layouter */
   bui.layouter.makeLayouterFormat = function(jdata){
      var cc=0; // node index counter
      var ccc=1; // compartment index counter (starts with 1 as 0 is no compartment)
      var idx={};
      var cpidx={};
      var s=""; // string to be passed to layouter (as a file)
      var cphash={};
      for (var i=0;i<jdata.nodes.length;i++){ // create node indexes; write output for compartments
         var n=jdata.nodes[i];
         if (n.is_abstract) continue; // abstract nodes are not send to the layouter
         if (bui.nodeMapping[n.sbo].klass === bui.Compartment){
            cpidx[n.id]=ccc;
            s = s + ccc + " " + n.id + "\n";
            if (n.data.subnodes){
               for (var i in n.data.subnodes){
                  cphash[n.data.subnodes[i]]=ccc;
               }
            }
            ccc++;
         } else {
            idx[n.id]=cc;
            cc++;
         }
      }
      s = (ccc-1) + "\n" + s + "///\n"; // compartments
      s = s + cc + "\n"; // number of nodes
      //nodes
      for (var i=0;i<jdata.nodes.length;i++){
         var n=jdata.nodes[i];
         if (!idx.hasOwnProperty(n.id)) continue; 
         s = s + idx[n.id] + "\n";
         s = s + (bui.nodeMapping[n.sbo].klass === bui.Process ? 'Reaction' : 'Compound') + "\n";
         s = s + n.id + "\n";
         s = s + (n.data.compartment ? cpidx[n.data.compartment] : (cphash[n.id] ? cphash[n.id] : 0)) + "\n";
         s = s + (n.data.x ? n.data.x : 0) + "\n";
         s = s + (n.data.y ? n.data.y : 0) + "\n";
         s = s + (n.data.width ? n.data.width : 0) + "\n";
         s = s + (n.data.height ? n.data.height : 0) + "\n";
         s = s + (n.data.dir ? n.data.dir : 0) + "\n";
      }
      s = s + "///\n";
      
      //edges
      var se='';
      cc=0;
      for (var i=0;i<jdata.edges.length;i++){
         e=jdata.edges[i];
         var tp=bui.edgeMarkerMapping[e.sbo];
         var type;
         if (tp) {
            switch (tp.klass) {
               case (bui.connectingArcs.substrate.id) :
                  type="Substrate";
                  break;
               case (bui.connectingArcs.production.id) :
                  type="Product";
                  break;
               case (bui.connectingArcs.catalysis.id) :
                  type="Catalyst";
                  break;
               case (bui.connectingArcs.inhibition.id) :
                  type="Inhibitor";
                  break;
               case (bui.connectingArcs.stimulation.id) :
                  type="Activator";
                  break;
               case (bui.connectingArcs.necessarystimulation.id) :
                  type="Activator";
                  break;
               case (bui.connectingArcs.modulation.id) :
                  type="Activator";
            }
         }
         if (type) {
            se = se + type + " " + idx[e.source] + " " + idx[e.target] + "\n";
            cc++;
         }
      }
      s = s + cc + "\n" + se + "\n";
      return s;
   };
   /* extracts position information from layouter output and includes it into json data */
   bui.layouter.fromLayouterFormat = function(jdata,lt){ // jdata - original json input data, lt - layouter output
      var nh={};
      for (var i=0;i<jdata.nodes.length;i++){
         var n=jdata.nodes[i];
         nh[n.id]=i;
      }
      var lines=lt.split("\n");
      var minx=1000000000000000000;
      var miny=1000000000000000000;
      while (lines.length){
         if (lines.shift() == '///') break; // edge section is currently ignored - no splines supported
         var type=lines.shift();
         var id=lines.shift();
         lines.shift(); // compartment
         var x=lines.shift();
         var y=lines.shift();
         var w=lines.shift();
         if (lines.length==0) break; // needed if emtpy lines at end of file
            var h=lines.shift();
         lines.shift(); //dir
         if (!nh.hasOwnProperty(id)){
            if (id != 'unknown') console.log('unknown id ' + id + '. runaway data?'); // unknown is the id of the unknown compartment defined by the layouter
               continue;
         }
         var n=jdata.nodes[nh[id]];
         if (type=="Compartment"){
            n.data.x=1*x;
            n.data.y=-y-h;
            n.data.width=1*w;
            n.data.height=1*h;
         } else {
            n.data.x=1*x-w/2;
            n.data.y=-y-h/2;
         }
         if (minx>n.data.x) minx=n.data.x;
         if (miny>n.data.y) miny=n.data.y;
      }
      for (var i=0;i<jdata.nodes.length;i++){ // make all positions positive; i.e. move to (0,0)
         var n=jdata.nodes[i];
         if (n.is_abstract) continue;
         if (n.data.x != undefined) n.data.x-=minx;
         if (n.data.y != undefined) n.data.y-=miny;
      }
      for (var i=0;i<jdata.nodes.length;i++){ // make positions relative to their compartments
         var n=jdata.nodes[i];
         if (n.is_abstract) continue;
         if (nh.hasOwnProperty(n.data.compartment)){
            var cp=jdata.nodes[nh[n.data.compartment]];
            if (n.data.x != undefined) n.data.x-=cp.data.x;
            if (n.data.y != undefined) n.data.y-=cp.data.y;
         }
      }
   }


})(bui);