### Build
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build

WORKDIR /app

COPY . ./

RUN dotnet publish --configuration Release -o ./artifacts KillerPoolApi

### Deploy
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS final

WORKDIR /app

COPY --from=build /app/artifacts .

RUN ln -sf /usr/share/zoneinfo/Europe/Zurich /etc/localtime && \
  dpkg-reconfigure -f noninteractive tzdata

ENTRYPOINT [ "dotnet" ]
CMD [ "KillerPoolApi.dll" ]
