# User Secrets Management

View and manages user secretes for .NET Core/.NET5+ projects just like in Visual Studio.

## Features

Right click on your `.csproj`, `.fsproj` or `.vbproj` file and select `Manage User Secrets`.

It will open the `secret.json` file or create a new one and update your project file.

\!\[feature X\]\(images/feature-x.png\)

## Requirements

This extension has the following dependencies:

* `uuid`: to generate a new GUID.
* `fast-xml-parser`: to parse and modify the project file.

## Release Notes

### 1.0.0

Initial release

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

