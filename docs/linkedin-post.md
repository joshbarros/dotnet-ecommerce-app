I'm building DevStore as a learning project to deepen my C# and ASP.NET Core skills, alongside Angular in an Nx monorepo.

The first milestone is a working catalog: real HTTP integration, BRL prices, loading/error states, Problem Details and a Docker Compose setup with an unprivileged Nginx reverse proxy.

I verified native builds and six HTTP smoke tests on Linux, then built and ran both Docker images and repeated the tests through Nginx. It is still a catalog prototype, without checkout or payments.

Next: persistence with EF Core and PostgreSQL, followed by cart and simulated orders.

Repository: add the real URL after publication.
