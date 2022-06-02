import steps from "./steps.mjs";

const pointer = {};
const stepsMap = [];

const controls = {
  trim: (s, c) => {
    if (c === "]") c = "\\]";
    if (c === "^") c = "\\^";
    if (c === "\\") c = "\\\\";
    return s.replace(new RegExp("^[" + c + "]+|[" + c + "]+$", "g"), "");
  },
  forward: (step) => {
    pointer["prev"] = position["current"];
    stepsMap.push(step);
    position["current"] = step;
  },
  backward: () => {
    pointer["next"] = pointer["current"];
    pointer["current"] = pointer["prev"];
    stepsMap.splice(2); //remove the last 2 positions
    let lastPosition = stepsMap.slice(-1)[0]; //get last position
    pointer["prev"] = lastPosition ?? null;
  },
  getStep: (step) => {
    return !!steps[step] ? steps[step] : null;
  },
  setStep: (step) => {
    if (step && steps[step]) pointer["current"] = step;
  },
  getCurrentStep: () => {
    return steps[pointer["current"]];
  },
  match: (str) => {
    if (typeof str !== "string" || !str) return false;
    
    console.log({str});
    let step = controls.getStep(pointer["current"]);
    console.log({ current:pointer["current"], step });

    if (!step) step = controls.getStep("begin");

    //is the end of the process
    if (step.triggers && Object.keys(step.triggers).length===0) return false;

    //is specting an image
    if (step.isMedia && str=="isImage") return Object.keys(step.triggers)[0];

    for (let i in step.triggers) {
      let keywords = step.triggers[i];
      console.log({ keywords });
      i = controls.trim(i, ":");
      if (!keywords) return i;

      let matches = keywords.filter((keyword) => {
        console.log(keyword, str?.toLowerCase()?.indexOf(keyword));
        return str?.toLowerCase()?.indexOf(keyword) !== -1;
      }).length;
    
      console.log({ matches });

      if (matches) return i;
    }
    return false;
  },
  move: (direction, str) => {
    let _step = controls.match(str);
    if (_step) {
      if (direction === "forward" || direction === "next")
        controls.forward(_step);
      if (direction === "backward" || direction === "prev") controls.backward();
    }
  },
  needMe:(str)=>{
    let step = controls.getStep("begin");
    
    if (!step) return false;

    for (let i in step.triggers) {
      let keywords = step.triggers[i];

      if (!keywords) return i;

      let matches = keywords.filter((keyword) => {
        return str.indexOf(keyword) !== -1;
      }).length;

      return matches ? i : false;
    }
  },
};
const Bot = {
  steps,
  controls,
};
export default Bot;