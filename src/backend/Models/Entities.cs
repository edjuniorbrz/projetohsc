namespace Portal5W2H.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string PasswordHash { get; set; }
        public required string Role { get; set; } // "Manager", "Analyst", "SuperAdmin"
    }

    public class Project
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public required string Status { get; set; } // "Planejamento", "Em Andamento", "Atrasado"
        public DateTime DueDate { get; set; }
        public int Progress { get; set; } // 0 to 100
    }

    public class ProjectTask
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public string? Description { get; set; }
        public required string Status { get; set; } // "todo", "inProgress", "review", "done"
        
        public int? AssigneeId { get; set; }
        public User? Assignee { get; set; }

        public int? ProjectId { get; set; }
        public Project? Project { get; set; }
    }
}
