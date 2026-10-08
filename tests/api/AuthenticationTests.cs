using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace Ecommerce.Api.Tests;

public class AuthenticationTests : IClassFixture<ApiFactory>
{
    private const string Password = "StrongPass!1";
    private readonly HttpClient _client;

    public AuthenticationTests(ApiFactory factory) => _client = factory.CreateClient();

    private static readonly Func<string> Email = () => $"user-{Guid.NewGuid():N}@example.com";

    [Fact]
    public async Task Account_Anonymous_Returns401() =>
        Assert.Equal(HttpStatusCode.Unauthorized, (await _client.GetAsync("/api/account")).StatusCode);

    [Fact]
    public async Task Orders_Anonymous_Returns401() =>
        Assert.Equal(HttpStatusCode.Unauthorized, (await _client.GetAsync("/api/orders")).StatusCode);

    [Fact]
    public async Task Register_CreatesSession()
    {
        var email = Email();

        var response = await _client.PostAsJsonAsync("/api/auth/register",
            new { name = "Tester", email, password = Password });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<CustomerDto>();
        Assert.NotNull(dto);
        Assert.Equal(email, dto!.Email);

        // the session cookie is held by the shared client handler
        Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/api/account")).StatusCode);
    }

    [Fact]
    public async Task Register_DuplicateEmail_Returns400()
    {
        var email = Email();
        var body = new { name = "Tester", email, password = Password };

        Assert.Equal(HttpStatusCode.OK, (await _client.PostAsJsonAsync("/api/auth/register", body)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync("/api/auth/register", body)).StatusCode);
    }

    [Fact]
    public async Task Login_InvalidCredentials_Returns401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new { email = Email(), password = "WrongPass!1" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_Correct_ThenLogout_EndsSession()
    {
        var email = Email();
        await _client.PostAsJsonAsync("/api/auth/register", new { name = "Tester", email, password = Password });

        Assert.Equal(HttpStatusCode.OK, (await _client.PostAsJsonAsync("/api/auth/login", new { email, password = Password })).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await _client.GetAsync("/api/account")).StatusCode);

        Assert.Equal(HttpStatusCode.NoContent, (await _client.PostAsync("/api/auth/logout", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await _client.GetAsync("/api/account")).StatusCode);
    }

    private sealed record CustomerDto(string Id, string Name, string Email);
}