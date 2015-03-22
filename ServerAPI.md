# Server API #

The server serves the JS browser client applications,
whenever the user's demands exeed the client's abilities.
web2py controllers thereby execute
the necessary python class functions appropriately on the server
and return the results to the JS client.

## List of supported server functions ##

  1. /Simulate/Iterate?state -> returns JSON : Perform a single Iteration
  1. /Simulate/InitialSeed -> returns JSON : Get a Guess Seed for the network
  1. /Simulate/AttractorSearch?states -> returns JSON : Searches for attractors given initial states
  1. /Put/UploadSBML?file : saves the uploaded SBML file in the uploads directory of the server

You must use the POST method, since the input data usually exceeds max GET request length. Sessions are used to store the initial seed and the name of the SBML file.