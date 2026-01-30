# Specification: DingTalk Channel Token Configuration

## ADDED Requirements

### Requirement: DingTalk Credential Configuration Tool

The system MUST provide an Agent tool that allows users to configure DingTalk application credentials (appKey, appSecret, agentId) through conversational interface.

#### Scenario: User configures DingTalk via Agent tool

**Given** the user has a DingTalk enterprise application with appKey, appSecret, and agentId
**When** the user invokes the `configure_dingtalk` Agent tool with valid credentials
**Then** the system SHOULD:
- Save the credentials to the configuration file under `channels.dingtalk.accounts.<accountId>`
- Validate the credentials by attempting to fetch an access token from DingTalk API
- Return a success response indicating the configuration was saved and validated
- Enable the DingTalk channel for sending messages

**And** the validation SHOULD include:
- Calling DingTalk's `gettoken` API with the provided appKey and appSecret
- Verifying the response contains a valid access token
- Caching the access token for subsequent API calls

#### Scenario: User configures DingTalk with invalid credentials

**Given** the user provides incorrect appKey or appSecret
**When** the user invokes the `configure_dingtalk` Agent tool
**Then** the system SHOULD:
- Attempt to validate the credentials via DingTalk API
- Detect the authentication failure (errcode !== 0)
- Return an error response with clear message: "Failed to authenticate with DingTalk: <errmsg>"
- NOT save invalid credentials to configuration
- Provide guidance on how to obtain valid credentials

#### Scenario: User configures multiple DingTalk accounts

**Given** the user wants to configure multiple DingTalk applications
**When** the user invokes `configure_dingtalk` with different accountId values
**Then** the system SHOULD:
- Save each account configuration under separate account IDs
- Validate each account independently
- Allow switching between accounts using the accountId parameter
- Support listing all configured accounts

#### Scenario: Agent tool input validation

**Given** the user invokes the `configure_dingtalk` Agent tool
**When** required parameters (appKey, appSecret) are missing or invalid
**Then** the system SHOULD:
- Reject the request with appropriate error message
- Specify which parameters are missing
- NOT attempt to call DingTalk API
- Return structured error response

### Requirement: DingTalk Credential Validation

The system MUST validate DingTalk credentials before saving them to configuration and provide clear feedback about validation results.

#### Scenario: Successful credential validation

**Given** the user provides valid appKey and appSecret
**When** the system validates the credentials
**Then** the system SHOULD:
- Send GET request to `https://oapi.dingtalk.com/gettoken?appkey=<appKey>&appsecret=<appSecret>`
- Receive response with `errcode: 0` and `access_token` field
- Extract and cache the access token with expiration time
- Return validation success response
- Save credentials to configuration

#### Scenario: Credential validation with API error

**Given** the user provides invalid appKey or appSecret
**When** the system validates the credentials
**Then** the system SHOULD:
- Receive response with `errcode !== 0`
- Extract the error message from `errmsg` field
- Return validation failure response with error details
- Include the DingTalk API error code and message in the response
- NOT save invalid credentials

#### Scenario: Credential validation with network error

**Given** the system attempts to validate credentials
**When** network request fails (timeout, DNS error, etc.)
**Then** the system SHOULD:
- Catch the network error
- Return validation failure response indicating network issue
- Suggest checking network connectivity
- NOT save credentials until validation succeeds

### Requirement: DingTalk Agent Tool Interface

The `configure_dingtalk` Agent tool MUST accept specific parameters and return structured responses for success and failure cases.

#### Scenario: Tool accepts valid parameters

**Given** the Agent tool is invoked
**When** all required parameters are provided with valid values
**Then** the tool SHOULD accept:
- `appKey` (string, required): DingTalk application AppKey
- `appSecret` (string, required): DingTalk application AppSecret
- `agentId` (string, optional): DingTalk robot AgentId
- `accountId` (string, optional): Account identifier, defaults to "default"
- `name` (string, optional): Display name for the account

#### Scenario: Tool returns success response

**Given** the credentials were successfully configured and validated
**When** the tool completes execution
**Then** the tool SHOULD return:
```json
{
  "success": true,
  "message": "DingTalk account configured successfully",
  "accountId": "<configured-account-id>",
  "validated": true,
  "details": {
    "appKey": "<app-key>",
    "agentId": "<agent-id>",
    "accessTokenExpiresAt": "<timestamp>"
  }
}
```

#### Scenario: Tool returns validation failure response

**Given** the credential validation failed
**When** the tool completes execution
**Then** the tool SHOULD return:
```json
{
  "success": false,
  "message": "Failed to validate DingTalk credentials",
  "error": "<error-details>",
  "errorCode": "<dingtalk-errcode>",
  "details": {
    "helpUrl": "https://open.dingtalk.com/document/..."
  }
}
```

### Requirement: Configuration Persistence

The system MUST persist validated DingTalk credentials to the configuration file and reload them when needed.

#### Scenario: Credentials saved to configuration file

**Given** credential validation succeeded
**When** the tool saves the configuration
**Then** the system SHOULD:
- Write configuration to `~/.clawdbot/config.json`
- Use path `channels.dingtalk.accounts.<accountId>.appKey`
- Use path `channels.dingtalk.accounts.<accountId>.appSecret`
- Use path `channels.dingtalk.accounts.<accountId>.agentId` (if provided)
- Set `channels.dingtalk.accounts.<accountId>.enabled = true`
- Trigger configuration reload for affected components

#### Scenario: Configuration reload after update

**Given** the configuration file has been updated
**When** the tool completes
**Then** the system SHOULD:
- Trigger hot-reload of channel configuration
- Clear any cached access tokens for the updated account
- Re-validate the account configuration
- Log the configuration reload event

### Requirement: Access Token Management

The system MUST manage DingTalk access tokens with automatic caching, refresh, and error handling.

#### Scenario: Access token cached after validation

**Given** credential validation succeeded
**When** access token is obtained from DingTalk API
**Then** the system SHOULD:
- Cache the token in memory with expiration time
- Set expiration to `expires_in - 60` seconds (buffer time)
- Reuse cached token for subsequent API calls until expiration

#### Scenario: Access token refreshed on expiration

**Given** a cached access token has expired
**When** a new API call needs the token
**Then** the system SHOULD:
- Detect token expiration (current time >= expiresAt)
- Fetch new access token using cached appKey/appSecret
- Update the cache with new token and expiration
- Proceed with the API call using new token

## MODIFIED Requirements

### Requirement: DingTalk Agent Tools Registration

**Existing:** The DingTalk plugin registers a `createLoginTool` that prompts for QR code scanning.

**Modified To:** The plugin MUST register both the existing `createLoginTool` and the new `configureDingTalk` tool, allowing users to choose between QR code login and credential configuration.

#### Scenario: Plugin exports both login tools

**Given** the DingTalk plugin is loaded
**When** the runtime queries available agent tools
**Then** the plugin SHOULD provide:
- `dingtalk_login`: Existing QR code login tool
- `configure_dingtalk`: New credential configuration tool

#### Scenario: Agent invokes configuration tool

**Given** the AI agent determines the user wants to configure DingTalk
**When** the agent calls the `configure_dingtalk` tool
**Then** the runtime MUST:
- Route the call to the DingTalk plugin's handler
- Execute the configuration logic
- Return the result to the agent
- Allow the agent to inform the user of the outcome

### Requirement: DingTalk Channel Capabilities

**Existing:** The DingTalk channel supports sending text and media messages using pre-configured credentials.

**Modified To:** The channel MUST also support credential configuration through Agent tools, enabling post-setup configuration without manual file editing.

#### Scenario: Channel configured via Agent tool

**Given** the DingTalk channel is initially unconfigured
**When** the user configures credentials via the `configure_dingtalk` tool
**Then** the channel SHOULD:
- Transition from unconfigured to configured state
- Become available for sending messages
- Report `configured: true` in status checks
- Allow message sending operations

#### Scenario: Channel status reflects configuration

**Given** the DingTalk channel has been configured
**When** a status check is performed
**Then** the channel MUST report:
- `enabled: true` (if not explicitly disabled)
- `configured: true`
- `linked: true`
- The configured `accountId` and `name`
