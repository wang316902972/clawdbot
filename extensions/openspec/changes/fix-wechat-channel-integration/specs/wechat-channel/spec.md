# WeChat Channel Specification

## ADDED Requirements

### Requirement: Inbound Message Processing
The system SHALL process incoming WeChat messages through the Clawdbot message handling pipeline.

#### Scenario: WeChat text message received
- **WHEN** a text message is received on WeChat
- **THEN** the system SHALL extract sender, recipient, and content
- **AND** the system SHALL emit the message to the Clawdbot inbound processor
- **AND** the system SHALL record the message in the session history

#### Scenario: WeChat media message received
- **WHEN** a media message (image/file) is received on WeChat
- **THEN** the system SHALL extract and download the media
- **AND** the system SHALL emit the message with media metadata to the Clawdbot inbound processor
- **AND** the system SHALL respect media size limits

#### Scenario: WeChat group message received
- **WHEN** a message is received in a WeChat group
- **THEN** the system SHALL extract group ID and sender info
- **AND** the system SHALL apply mention gating if configured
- **AND** the system SHALL process the message according to group policy

### Requirement: Outbound Message Adapter
The system SHALL provide a standard outbound adapter for WeChat following the Clawdbot channel adapter pattern.

#### Scenario: Send text message
- **WHEN** the agent sends a text message to WeChat
- **THEN** the system SHALL use the WeChat outbound adapter
- **AND** the system SHALL respect text chunking limits
- **AND** the system SHALL handle markdown formatting

#### Scenario: Send media message
- **WHEN** the agent sends media to WeChat
- **THEN** the system SHALL download and format the media
- **AND** the system SHALL send through the WeChat bot
- **AND** the system SHALL respect media size limits

### Requirement: Bot Lifecycle Management
The system SHALL properly manage WeChat bot lifecycle (start, stop, login, logout).

#### Scenario: Bot startup
- **WHEN** a WeChat account is enabled
- **THEN** the system SHALL start the WeChat bot
- **AND** the system SHALL handle QR code scanning for login
- **AND** the system SHALL emit login status events

#### Scenario: Bot error handling
- **WHEN** the WeChat bot encounters an error
- **THEN** the system SHALL log the error
- **AND** the system SHALL attempt reconnection according to retry policy
- **AND** the system SHALL notify the user of connection issues

## MODIFIED Requirements

### Requirement: WeChat Channel Plugin
The WeChat plugin SHALL integrate with Clawdbot using the standard plugin SDK pattern.

#### Scenario: Plugin registration
- **WHEN** the WeChat plugin is registered
- **THEN** the system SHALL use implementations from `src/wechat/`
- **AND** the system SHALL NOT duplicate code in `extensions/wechat/`
- **AND** the system SHALL provide all required channel adapters (outbound, directory, etc.)

#### Scenario: Configuration
- **WHEN** WeChat channel is configured
- **THEN** the system SHALL support multi-account configuration
- **AND** the system SHALL validate account settings
- **AND** the system SHALL provide clear error messages for invalid configuration
