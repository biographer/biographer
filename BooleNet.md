# BooleNet format extension #

## Annotations ##
Additionally to the Python update rules, the Simulator also imports state interpretations (see also Nodes) as well as annotations.
```
Ras* = Ras1p or Ras2p
# States of Ras: True="active", False="inactive"
# Annotation of Ras: "pretty cool protein"
```
In order to be fully compatible with the Python boolenet environment,
both informations are coded as Python comments.

## Compartments ##
In a similar manner, we additionally plan to include a possibility to add compartments:
```
# Compartment Cytosol: Ras1, Ras2, Whi2, Nucleus
Ras1 = True
Ras2 = True
Whi2 = False

# Compartment Nucleus: DNA
DNA = True
```