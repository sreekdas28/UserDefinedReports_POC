using System.Text.Json.Serialization;

namespace StimulsoftPOC
{
    public class Employee
    {
        public int Id { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Email { get; set; }

        public string Phone { get; set; }

        public string Gender { get; set; }

        public int Age { get; set; }

        public string JobTitle { get; set; }

        public int YearsOfExperience { get; set; }

        public int Salary { get; set; }

        public string Department { get; set; }
    }
}
