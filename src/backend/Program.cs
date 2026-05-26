using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Portal5W2H.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configuração do JWT
var jwtKey = "MinhaChaveSuperSecretaPortal5W2H2026!"; // Em produção, colocar no appsettings.json
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// Create DB automatically and Seed Data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // CUIDADO: EnsureDeleted reseta o banco. Útil no MVP para limpar lixo de testes.
    db.Database.EnsureDeleted(); 
    db.Database.EnsureCreated();

    if (!db.Users.Any())
    {
        db.Users.AddRange(
            new User { Name = "Super Admin", Email = "admin@portal.com", PasswordHash = "123456", Role = "SuperAdmin" },
            new User { Name = "João Gestor", Email = "gestor@portal.com", PasswordHash = "123456", Role = "Manager" },
            new User { Name = "Maria Analista", Email = "analista@portal.com", PasswordHash = "123456", Role = "Analyst" }
        );
        db.SaveChanges();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// ===============================
// AUTH ENDPOINTS
// ===============================
app.MapPost("/api/auth/login", (LoginRequest req, AppDbContext db) =>
{
    var user = db.Users.FirstOrDefault(u => u.Email == req.Email && u.PasswordHash == req.Password);
    
    if (user == null)
        return Results.Unauthorized();

    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.UTF8.GetBytes(jwtKey);
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        }),
        Expires = DateTime.UtcNow.AddHours(8),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };
    
    var token = tokenHandler.CreateToken(tokenDescriptor);
    
    return Results.Ok(new { 
        Token = tokenHandler.WriteToken(token),
        User = new { user.Id, user.Name, user.Email, user.Role }
    });
});

// ===============================
// API ENDPOINTS (PROTECTED)
// ===============================
app.MapGet("/", () => $"Portal 5W2H API - Environment: {app.Environment.EnvironmentName}");

app.MapGet("/api/projects", async (AppDbContext db) =>
    await db.Projects.ToListAsync()).RequireAuthorization();

app.MapPost("/api/projects", async (Project project, AppDbContext db) =>
{
    db.Projects.Add(project);
    await db.SaveChangesAsync();
    return Results.Created($"/api/projects/{project.Id}", project);
}).RequireAuthorization();

app.Run();

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
