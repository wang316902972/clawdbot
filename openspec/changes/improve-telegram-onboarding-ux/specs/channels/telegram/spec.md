## ADDED Requirements

### Requirement: Telegram Bot Token Format Validation
The system SHALL validate Telegram bot token format before accepting user input.

#### Scenario: Valid token format accepted
- **WHEN** user enters a token matching format `123456:ABC...`
- **THEN** system accepts the token as valid format

#### Scenario: Invalid token format rejected
- **WHEN** user enters a token not matching the expected format
- **THEN** system displays specific error message describing correct format
- **AND** system highlights which part of the format is incorrect

#### Scenario: Token format validation details
- **WHEN** validating token format
- **THEN** system checks for pattern: `^\d+:[A-Za-z0-9_-]{35}$`
- **AND** system provides example: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567890`

### Requirement: Telegram Bot Token Connection Test
The system SHALL provide ability to test Telegram bot token validity before saving configuration.

#### Scenario: Successful token test
- **WHEN** user submits token and test succeeds
- **THEN** system calls `getMe` API endpoint
- **AND** system displays bot information (name, username)
- **AND** system confirms token is valid

#### Scenario: Token test with invalid token
- **WHEN** API returns 401 Unauthorized
- **THEN** system displays "Invalid token" error
- **AND** system suggests checking BotFather for correct token
- **AND** system does not save the invalid token

#### Scenario: Token test with network error
- **WHEN** network connection fails during test
- **THEN** system displays "Network error" message
- **AND** system offers option to retry or skip test
- **AND** system allows saving token without successful test (user choice)

#### Scenario: Token test timeout
- **WHEN** API call takes longer than 10 seconds
- **THEN** system cancels the test
- **AND** system displays timeout message
- **AND** system allows user to retry or proceed without test

### Requirement: Enhanced BotFather Instructions
The system SHALL provide detailed step-by-step instructions for obtaining Telegram bot token.

#### Scenario: Display BotFather instructions
- **WHEN** user reaches token configuration step
- **THEN** system displays numbered steps for BotFather interaction
- **AND** system includes example conversation with @BotFather
- **AND** system provides link to Telegram official documentation

#### Scenario: BotFather instructions include examples
- **WHEN** showing instructions
- **THEN** system includes example `/newbot` command
- **AND** system shows example bot name selection
- **AND** system shows example token location in response

### Requirement: Telegram Quick Setup Command
The system SHALL provide dedicated command for Telegram bot configuration.

#### Scenario: Interactive setup command
- **WHEN** user runs `clawdbot telegram setup`
- **THEN** system prompts for bot token interactively
- **AND** system validates token format
- **AND** system offers connection test
- **AND** system saves token to configuration file
- **AND** system displays success message with bot information

#### Scenario: Non-interactive setup with flag
- **WHEN** user runs `clawdbot telegram setup --token <token>`
- **THEN** system uses provided token without prompt
- **AND** system validates token format
- **AND** system saves token to configuration
- **AND** system displays result (success or error)

#### Scenario: Test existing token
- **WHEN** user runs `clawdbot telegram setup --test`
- **THEN** system reads existing token from config
- **AND** system tests token validity
- **AND** system displays bot information or error
- **AND** system does not modify configuration

#### Scenario: Setup specific account
- **WHEN** user runs `clawdbot telegram setup --account <id>`
- **THEN** system configures token for specified account
- **AND** system updates `channels.telegram.accounts.<id>.botToken`
- **AND** system defaults to "default" account if flag omitted

### Requirement: Friendly Error Messages
The system SHALL provide actionable error messages for common Telegram configuration issues.

#### Scenario: Invalid token format error
- **WHEN** token format validation fails
- **THEN** system displays message: "Token format invalid. Expected format: 123456:ABC..."
- **AND** system shows which part is incorrect (missing colon, wrong length, etc.)

#### Scenario: Token authorization failed
- **WHEN** API returns 401 or 403
- **THEN** system displays: "Token rejected by Telegram. Please check with @BotFather"
- **AND** system suggests regenerating token if recently created

#### Scenario: Network connectivity error
- **WHEN** cannot reach Telegram API
- **THEN** system displays: "Cannot connect to Telegram. Check your internet connection"
- **AND** system offers retry option

#### Scenario: Bot privacy mode enabled
- **WHEN** bot cannot read messages in groups
- **THEN** system displays: "Bot privacy mode is enabled. Disable in @BotFather: /setprivacy"
- **AND** system provides link to documentation

## MODIFIED Requirements

### Requirement: Telegram Channel Onboarding
The onboarding process SHALL validate and test Telegram bot token before saving configuration.

#### Scenario: Token validation during onboarding
- **WHEN** user enters token in onboarding wizard
- **THEN** system validates token format
- **AND** system optionally tests connection (user can skip)
- **AND** system proceeds to allowlist configuration only if token is valid

#### Scenario: Enhanced error recovery
- **WHEN** token validation or test fails
- **THEN** system displays specific error message
- **AND** system offers retry option
- **AND** system provides help link to troubleshooting docs
