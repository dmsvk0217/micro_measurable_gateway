const db = require("./firebase/firebase.js");

getNodeInfoArr();

async function getNodeInfoArr() {
  let nodeInfoArr = [];
  const nodeInfoArrRef = db.collection("node-info");
  const snapshot = await nodeInfoArrRef.get();

  snapshot.forEach((doc) => {
    let docData = doc.data();
    console.log(docData);
    docData["id"] = doc.id;
    nodeInfoArr.push(docData);
  });

  const nodeInfoRef = db.collection("node-info").where("nodeAddress", "==", 4);

  const nodeInfoSnapshot = await nodeInfoRef.get();
  if (nodeInfoSnapshot.empty) {
    console.log("undefined");
    return undefined;
  }

  let nodeInfo = nodeInfoSnapshot.docs[0].data();
  nodeInfo["id"] = nodeInfoSnapshot.docs[0].id;
  console.log(nodeInfo);
  return nodeInfoArr;
}
