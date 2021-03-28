const evalutaionOptions = ["tracking", "location", "status", "price"];

const evalutatingRegEx = new RegExp(
  "^(eval:) (" + evalutaionOptions.join("|") + ")( [1-5])",
  "gi"
);

const evaluatedElementRegex = new RegExp(
  "^" + evalutaionOptions.join("|"),
  "im"
);
const starsOptions = ["1", "2", "3", "4", "5"];

let helpMsg = "you can review an order by entering its tracking number \n";

let welcomeMsg = "please enter the tracking number to review the order \n";

function createMSgWithName(msg, name) {
  var msg = "Dear " + name + "," + msg + "\n";

  return msg;
}

function createEvaluationExpression(evaluatedElement, numberOfStarts) {
  return "eval:" + " " + evaluatedElement + " " + numberOfStarts;
}

exports.welcomeMsg = welcomeMsg;
exports.helpMsg = helpMsg;
exports.evalutaionOptions = evalutaionOptions;
exports.starsOptions = starsOptions;
exports.evalutatingRegEx = evalutatingRegEx;
exports.evaluatedElementRegex = evaluatedElementRegex;
exports.createEvaluationExpression = createEvaluationExpression;
exports.createMSgWithName = createMSgWithName;
