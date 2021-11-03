using System;
using System.Collections;


// *****ATM app made by Tyler Bailly****
// 10/30/21

class ATM
{


  static void USD (int pin, int decide)	// Where banking decisons are processed
  {

    Hashtable data = new Hashtable ();

    // Customer pins with present balance

      data.Add (3257, 1000);
      data.Add (1402, 43);
      data.Add (5555, 54);
      data.Add (8989, 760);
      data.Add (4532, 40000);
      data.Add (1234, -1);
      data.Add (5746, 5);
      data.Add (6969, 500);
      data.Add (6346, 89);
      data.Add (3579, 700);
      data.Add (6849, 6);

    if (decide == 1)
      {

	if (data.ContainsKey (pin))	// Finds balance
	  {
	    Console.WriteLine ("Your balance is $ {0}", data[pin]);
	    customerMenu (pin);
	  }

      }
    else if (decide == 2)	// Deposit function
      {
	Console.WriteLine ("Please enter amount you will deposit");
	int amount = Convert.ToInt32 (Console.ReadLine ());
	if (data.ContainsKey (pin))
	  {
	    amount += (int) data[pin];
	    Console.WriteLine ("Your new balance is $" + amount);
	    Console.WriteLine ("Now dispensing....");
	    Console.WriteLine ("This session has now ended....");
	  }
      }
    else if (decide == 3)	// Withdraw function 
      {
	Console.WriteLine ("Please enter amount to be withdrawn");
	int withdraw = Convert.ToInt32 (Console.ReadLine ());
	if (data.ContainsKey (pin))
	  {
	    if (withdraw > (int) data[pin])
	      {
		Console.
		  WriteLine
		  ("This withdrawl is more than your present balance...");
		USD (pin, decide);
	      }


	    withdraw = (int) data[pin] - withdraw;
	    Console.WriteLine ("Your new balance is $" + withdraw);
	    Console.WriteLine ("This session has now ended....");
	  }
      }

    else if (decide == 4)	// Deposit a check function
      {
	Console.WriteLine ("Please enter here the amount of the check");
	int check = Convert.ToInt32 (Console.ReadLine ());
	if (data.ContainsKey (pin))
	  {
	    check += (int) data[pin];
	    Console.WriteLine ("Your new balance will be $" + check);
	    Console.
	      WriteLine
	      ("Please allow up to 5 business days for this transaction to be processed");
	    Console.WriteLine ("This session has now ended....");
	  }
      }
    else
      {

      }
  }

  static void customerMenu (int pin)	// customer menu once authenticated
  {
    Console.WriteLine ("1). State balance");	// USD method
    Console.WriteLine ("2). Deposit ");	// USD method
    Console.WriteLine ("3). Withdrawl");	// USD method
    Console.WriteLine ("4). Deposit a check");	// USD method
    Console.WriteLine ("5). Contact customer service");
    Console.WriteLine ("6). Secure exit");
    int decide = Convert.ToInt32 (Console.ReadLine ());

    if (decide == 1 || decide == 2 || decide == 3 || decide == 4)
      {
	USD (pin, decide);	// Numbers 1 to 4 are sent to USD along with pin and decide params
      }

    else if (decide == 5)
      {
	Console.
	  WriteLine ("A customer representative will be with you shortly");
      }
    else if (decide == 6)
      {
	Console.WriteLine ("Have a good day");
      }


    else
      {
	Console.WriteLine ("Not an option");
      }


  }


  static void authenticationMAIN (int pin)	// Main form of authentication given pin
  {
    Hashtable pins = new Hashtable ();

    // Customer pins followed by full namespace

    pins.Add (3257, "Dale Hansen");
    pins.Add (1402, "Tyler Han");
    pins.Add (5555, "Pat Magroin");
    pins.Add (8989, "Harry Cox");
    pins.Add (4532, "Barry Cox");
    pins.Add (1234, "Ash Tull");
    pins.Add (5746, "Ben Jack");
    pins.Add (6969, "Barry McKalister");
    pins.Add (6346, "Dixon Mcgregor");
    pins.Add (3579, "Haywood Simpson");
    pins.Add (6849, "Jack Hoffner");

    if (pins.ContainsKey (pin))
      {
	Console.WriteLine ("This session is encrypted!");
	Console.WriteLine ("Hello {0}", pins[pin]);
	customerMenu (pin);	// if pin is correct, we go to customerMenu for banking decision.

      }
    else
      {
	Console.WriteLine ("That is code is not correct");
      }

  }
  static void Main ()		// Main screen initial point of contact, only digits 1 through 9 allowed to be pushed, and only 4 digits at once allowed
  {

    int pin;
    Console.WriteLine ("Please type pin now ");
    pin = Convert.ToInt32 (Console.ReadLine ());
    authenticationMAIN (pin);	// pin sent to authenticationMAIN method to be authenticated


  }
}
