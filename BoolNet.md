# R BoolNet format #
The format is very similar to the Python booleannet format. Each gene is assigned a boolean update rule.

```
Rule = GeneName Separator BooleanExpression [Separator Probability];
BooleanExpression = GeneName
| "!" BooleanExpression
| "(" BooleanExpression ")"
| BooleanExpression " & " BooleanExpression
| BooleanExpression " | " BooleanExpression;
GeneName = ? A gene name from the list of involved genes ?;
Separator = ",";
Probability = ? A floating-point number ?;

```

# Demo network #

The demo network provided with the simulator is a mammalian cell cycle network introduced by Faur. It consists of 10 genes in total. The network achieves a cyclic steady state with 7 intermediary states.