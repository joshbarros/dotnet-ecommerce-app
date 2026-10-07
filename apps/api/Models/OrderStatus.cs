using System.Text.Json.Serialization;


namespace Ecommerce.Api.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum OrderStatus
{
    Confirmed = 0,
    Preparing = 1,
    Shipped = 2,
}