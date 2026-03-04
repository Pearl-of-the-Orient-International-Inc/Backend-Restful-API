"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openApiDocument = {
    "openapi": "3.1.0",
    "info": {
        "title": "Pearl of the Orient API Docs",
        "version": "1.0.0",
        "description": "## Quick Overview\n\n- API Version: `1.0.0`\n- Developer: `Kyle Andre Lim`\n- Base Path: `/api/v1`\n\nComprehensive API documentation for authentication, users, members, branch services, and offices endpoints.",
        "contact": {
            "name": "Kyle Andre Lim",
            "url": "https://docs-api.pearl-chaplaincy.com"
        },
        "license": {
            "name": "Apache-2.0",
            "url": "https://www.apache.org/licenses/LICENSE-2.0"
        }
    },
    "servers": [
        {
            "url": "/api/v1",
            "description": "Version 1 API base path"
        }
    ],
    "tags": [
        {
            "name": "System",
            "description": "Health and root metadata endpoints"
        },
        {
            "name": "Auth",
            "description": "Authentication and account recovery"
        },
        {
            "name": "Users",
            "description": "User profile and admin user management"
        },
        {
            "name": "Members",
            "description": "Member application and management"
        },
        {
            "name": "Branch Service",
            "description": "Branch of service management"
        },
        {
            "name": "Offices",
            "description": "Office title management"
        }
    ],
    "paths": {
        "/": {
            "get": {
                "tags": [
                    "System"
                ],
                "summary": "API root status",
                "operationId": "getApiRootStatus",
                "responses": {
                    "200": {
                        "description": "API status metadata",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ApiRootResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/auth/register": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Register an admin/member user",
                "operationId": "registerUser",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/RegisterRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "User registered",
                        "headers": {
                            "Set-Cookie": {
                                "schema": {
                                    "type": "string"
                                },
                                "description": "Sets the refreshToken HTTP-only cookie"
                            }
                        },
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/AuthSuccessResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/login": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Login (admin-only)",
                "operationId": "loginUser",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/LoginRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Login successful",
                        "headers": {
                            "Set-Cookie": {
                                "schema": {
                                    "type": "string"
                                },
                                "description": "Sets the refreshToken HTTP-only cookie"
                            }
                        },
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/AuthSuccessResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/logout": {
            "delete": {
                "tags": [
                    "Auth"
                ],
                "summary": "Logout current user",
                "operationId": "logoutUser",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Logged out"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/refresh-token": {
            "get": {
                "tags": [
                    "Auth"
                ],
                "summary": "Refresh access token using refreshToken cookie",
                "operationId": "refreshAccessToken",
                "security": [
                    {
                        "RefreshTokenCookie": []
                    }
                ],
                "responses": {
                    "200": {
                        "description": "New access token issued",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/RefreshTokenResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/forgot-password": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Send password reset email (admin-only account)",
                "operationId": "forgotPassword",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/ForgotPasswordRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "204": {
                        "description": "Password reset email sent"
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/reset-password": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Reset password using email token",
                "operationId": "resetPassword",
                "parameters": [
                    {
                        "name": "token",
                        "in": "query",
                        "required": true,
                        "schema": {
                            "type": "string"
                        },
                        "description": "Password reset token sent to email"
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/ResetPasswordRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "204": {
                        "description": "Password reset successfully"
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/verify-email": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Verify email by code",
                "operationId": "verifyEmail",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/VerifyEmailRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Email verified",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/VerifyEmailResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/resend-email-verification": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Resend email verification code",
                "operationId": "resendEmailVerification",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/ResendVerificationRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Verification code resent",
                        "headers": {
                            "Set-Cookie": {
                                "schema": {
                                    "type": "string"
                                },
                                "description": "Sets the refreshToken HTTP-only cookie"
                            }
                        },
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/AuthSuccessResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/users/current": {
            "get": {
                "tags": [
                    "Users"
                ],
                "summary": "Get current authenticated user",
                "operationId": "getCurrentUser",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Current user profile",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/UserEnvelopeResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            },
            "put": {
                "tags": [
                    "Users"
                ],
                "summary": "Update current authenticated user",
                "operationId": "updateCurrentUser",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/UpdateCurrentUserRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Current user updated",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/UserEnvelopeResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            },
            "delete": {
                "tags": [
                    "Users"
                ],
                "summary": "Delete current authenticated user",
                "operationId": "deleteCurrentUser",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "responses": {
                    "204": {
                        "description": "User deleted"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/users": {
            "get": {
                "tags": [
                    "Users"
                ],
                "summary": "List users (admin only)",
                "operationId": "getAllUsers",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "name": "limit",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 1
                        }
                    },
                    {
                        "name": "offset",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "minimum": 0
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "User list",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/UserListResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/users/{userId}": {
            "get": {
                "tags": [
                    "Users"
                ],
                "summary": "Get user by ID (admin only)",
                "operationId": "getUserById",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "name": "userId",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "User profile",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/UserEnvelopeResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            },
            "delete": {
                "tags": [
                    "Users"
                ],
                "summary": "Delete user by ID (admin only)",
                "operationId": "deleteUserById",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "name": "userId",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "204": {
                        "description": "User deleted"
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/members/apply": {
            "post": {
                "tags": [
                    "Members"
                ],
                "summary": "Apply as member",
                "operationId": "applyMember",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/ApplyMemberRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Member application submitted",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/MemberWriteResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/members/{id}/status": {
            "patch": {
                "tags": [
                    "Members"
                ],
                "summary": "Approve or reject member application (admin only)",
                "operationId": "updateMemberStatus",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/IdPath"
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/UpdateMemberStatusRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Member status updated",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/MemberWriteResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/members/pending": {
            "get": {
                "tags": [
                    "Members"
                ],
                "summary": "Get pending member applications (admin only)",
                "operationId": "getPendingMembers",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/PageQuery"
                    },
                    {
                        "$ref": "#/components/parameters/LimitQuery"
                    },
                    {
                        "$ref": "#/components/parameters/SearchQuery"
                    },
                    {
                        "$ref": "#/components/parameters/IncludeArchivedQuery"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Pending member list",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/MemberListResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/members": {
            "get": {
                "tags": [
                    "Members"
                ],
                "summary": "Get all members (admin only)",
                "operationId": "getAllMembers",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/PageQuery"
                    },
                    {
                        "$ref": "#/components/parameters/LimitQuery"
                    },
                    {
                        "$ref": "#/components/parameters/SearchQuery"
                    },
                    {
                        "$ref": "#/components/parameters/MemberStatusQuery"
                    },
                    {
                        "$ref": "#/components/parameters/IncludeArchivedQuery"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Member list",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/MemberListResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/members/{id}/archive": {
            "patch": {
                "tags": [
                    "Members"
                ],
                "summary": "Archive member (admin only)",
                "operationId": "archiveMember",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/IdPath"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Member archived",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/MemberWriteResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/members/{id}/retrieve": {
            "patch": {
                "tags": [
                    "Members"
                ],
                "summary": "Retrieve archived member (admin only)",
                "operationId": "retrieveMember",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/IdPath"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Member retrieved",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/MemberWriteResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/branch-service/create": {
            "post": {
                "tags": [
                    "Branch Service"
                ],
                "summary": "Create branch service (admin only)",
                "operationId": "createBranchService",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/CreateBranchServiceRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Branch service created",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/BranchServiceWriteResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/branch-service": {
            "get": {
                "tags": [
                    "Branch Service"
                ],
                "summary": "Get all branch services",
                "operationId": "getAllBranchServices",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/PageQuery"
                    },
                    {
                        "$ref": "#/components/parameters/LimitQuery"
                    },
                    {
                        "$ref": "#/components/parameters/SearchQuery"
                    },
                    {
                        "$ref": "#/components/parameters/SortByTitleCreatedUpdatedQuery"
                    },
                    {
                        "$ref": "#/components/parameters/SortOrderQuery"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Branch service list",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/BranchServiceListResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/branch-service/{id}": {
            "get": {
                "tags": [
                    "Branch Service"
                ],
                "summary": "Get branch service by ID",
                "operationId": "getBranchServiceById",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/IdPath"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Branch service details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/BranchServiceReadResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            },
            "put": {
                "tags": [
                    "Branch Service"
                ],
                "summary": "Update branch service (admin only)",
                "operationId": "updateBranchService",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/IdPath"
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/UpdateBranchServiceRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Branch service updated",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/BranchServiceWriteResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            },
            "delete": {
                "tags": [
                    "Branch Service"
                ],
                "summary": "Delete branch service (admin only)",
                "operationId": "deleteBranchService",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/IdPath"
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Branch service deleted"
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/offices/create": {
            "post": {
                "tags": [
                    "Offices"
                ],
                "summary": "Create office title (admin only)",
                "operationId": "createOfficeTitle",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/CreateOfficeRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Office title created",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/OfficeWriteResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/offices": {
            "get": {
                "tags": [
                    "Offices"
                ],
                "summary": "Get all office titles",
                "operationId": "getAllOfficeTitles",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/PageQuery"
                    },
                    {
                        "$ref": "#/components/parameters/LimitQuery"
                    },
                    {
                        "$ref": "#/components/parameters/SearchQuery"
                    },
                    {
                        "$ref": "#/components/parameters/SortByOfficeCreatedUpdatedQuery"
                    },
                    {
                        "$ref": "#/components/parameters/SortOrderQuery"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Office title list",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/OfficeListResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/offices/{id}": {
            "get": {
                "tags": [
                    "Offices"
                ],
                "summary": "Get office title by ID",
                "operationId": "getOfficeTitleById",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/IdPath"
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Office title details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/OfficeReadResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            },
            "put": {
                "tags": [
                    "Offices"
                ],
                "summary": "Update office title (admin only)",
                "operationId": "updateOfficeTitle",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/IdPath"
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/UpdateOfficeRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Office title updated",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/OfficeWriteResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            },
            "delete": {
                "tags": [
                    "Offices"
                ],
                "summary": "Delete office title (admin only)",
                "operationId": "deleteOfficeTitle",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/IdPath"
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Office title deleted"
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/two-factor/setup": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Initialize two-factor authenticator setup",
                "operationId": "setupTwoFactor",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Two-factor setup initialized",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/TwoFactorSetupResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/two-factor/enable": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Enable two-factor authentication",
                "operationId": "enableTwoFactor",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/TwoFactorEnableRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Two-factor authentication enabled",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/StatusResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/two-factor/disable": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Disable two-factor authentication",
                "operationId": "disableTwoFactor",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Two-factor authentication disabled",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/StatusResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/verify-two-factor": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Verify two-factor code and complete login",
                "operationId": "verifyTwoFactorLogin",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/VerifyTwoFactorRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Two-factor verification successful",
                        "headers": {
                            "Set-Cookie": {
                                "schema": {
                                    "type": "string"
                                },
                                "description": "Sets the refreshToken HTTP-only cookie"
                            }
                        },
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/AuthSuccessResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/passkey/status": {
            "get": {
                "tags": [
                    "Auth"
                ],
                "summary": "Get current user passkey status",
                "operationId": "getPasskeyStatus",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Passkey status",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/PasskeyStatusResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/passkey/register/options": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Generate passkey registration options",
                "operationId": "getPasskeyRegistrationOptions",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "requestBody": {
                    "required": false,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PasskeyRegistrationOptionsRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Passkey registration options generated",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/PasskeyRegistrationOptionsResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/passkey/register/verify": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Verify passkey registration response",
                "operationId": "verifyPasskeyRegistration",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PasskeyRegistrationVerifyRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Passkey registered successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/StatusResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/passkey/authenticate/options": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Generate passkey authentication options",
                "operationId": "getPasskeyAuthenticationOptions",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PasskeyAuthenticationOptionsRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Passkey authentication options generated",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/PasskeyAuthenticationOptionsResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "403": {
                        "$ref": "#/components/responses/ForbiddenError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/auth/passkey/authenticate/verify": {
            "post": {
                "tags": [
                    "Auth"
                ],
                "summary": "Verify passkey authentication and complete login",
                "operationId": "verifyPasskeyAuthentication",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "$ref": "#/components/schemas/PasskeyAuthenticationVerifyRequest"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Passkey authentication successful",
                        "headers": {
                            "Set-Cookie": {
                                "schema": {
                                    "type": "string"
                                },
                                "description": "Sets the refreshToken HTTP-only cookie"
                            }
                        },
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/AuthSuccessResponse"
                                }
                            }
                        }
                    },
                    "400": {
                        "$ref": "#/components/responses/ValidationError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "409": {
                        "$ref": "#/components/responses/ConflictError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/users/sessions": {
            "get": {
                "tags": [
                    "Users"
                ],
                "summary": "Get active sessions for current user",
                "operationId": "getUserSessions",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "responses": {
                    "200": {
                        "description": "User sessions retrieved",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/UserSessionsResponse"
                                }
                            }
                        }
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/users/sessions/others": {
            "delete": {
                "tags": [
                    "Users"
                ],
                "summary": "Revoke all other sessions except current",
                "operationId": "revokeOtherUserSessions",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Other sessions revoked"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        },
        "/users/sessions/{sessionId}": {
            "delete": {
                "tags": [
                    "Users"
                ],
                "summary": "Revoke a specific session",
                "operationId": "revokeUserSession",
                "security": [
                    {
                        "BearerAuth": []
                    }
                ],
                "parameters": [
                    {
                        "$ref": "#/components/parameters/SessionIdPath"
                    }
                ],
                "responses": {
                    "204": {
                        "description": "Session revoked"
                    },
                    "400": {
                        "$ref": "#/components/responses/BadRequestError"
                    },
                    "401": {
                        "$ref": "#/components/responses/UnauthorizedError"
                    },
                    "404": {
                        "$ref": "#/components/responses/NotFoundError"
                    },
                    "500": {
                        "$ref": "#/components/responses/InternalServerError"
                    }
                }
            }
        }
    },
    "components": {
        "securitySchemes": {
            "BearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "Provide access token as: Bearer &lt;token&gt;"
            },
            "RefreshTokenCookie": {
                "type": "apiKey",
                "in": "cookie",
                "name": "refreshToken"
            }
        },
        "parameters": {
            "IdPath": {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {
                    "type": "string",
                    "format": "uuid"
                }
            },
            "PageQuery": {
                "name": "page",
                "in": "query",
                "required": false,
                "schema": {
                    "type": "integer",
                    "minimum": 1,
                    "default": 1
                }
            },
            "LimitQuery": {
                "name": "limit",
                "in": "query",
                "required": false,
                "schema": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100,
                    "default": 10
                }
            },
            "SearchQuery": {
                "name": "search",
                "in": "query",
                "required": false,
                "schema": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 100
                }
            },
            "MemberStatusQuery": {
                "name": "status",
                "in": "query",
                "required": false,
                "schema": {
                    "$ref": "#/components/schemas/MemberStatus"
                }
            },
            "IncludeArchivedQuery": {
                "name": "includeArchived",
                "in": "query",
                "required": false,
                "schema": {
                    "type": "boolean",
                    "default": false
                }
            },
            "SortByTitleCreatedUpdatedQuery": {
                "name": "sortBy",
                "in": "query",
                "required": false,
                "schema": {
                    "type": "string",
                    "enum": [
                        "createdAt",
                        "updatedAt",
                        "title"
                    ]
                }
            },
            "SortByOfficeCreatedUpdatedQuery": {
                "name": "sortBy",
                "in": "query",
                "required": false,
                "schema": {
                    "type": "string",
                    "enum": [
                        "createdAt",
                        "updatedAt",
                        "name",
                        "title",
                        "level"
                    ]
                }
            },
            "SortOrderQuery": {
                "name": "sortOrder",
                "in": "query",
                "required": false,
                "schema": {
                    "type": "string",
                    "enum": [
                        "asc",
                        "desc"
                    ],
                    "default": "desc"
                }
            },
            "SessionIdPath": {
                "name": "sessionId",
                "in": "path",
                "required": true,
                "schema": {
                    "type": "string",
                    "format": "uuid"
                }
            }
        },
        "responses": {
            "BadRequestError": {
                "description": "Bad request",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorResponse"
                        }
                    }
                }
            },
            "ValidationError": {
                "description": "Validation failed",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ValidationErrorResponse"
                        }
                    }
                }
            },
            "UnauthorizedError": {
                "description": "Unauthorized",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorResponse"
                        }
                    }
                }
            },
            "ForbiddenError": {
                "description": "Forbidden",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorResponse"
                        }
                    }
                }
            },
            "NotFoundError": {
                "description": "Resource not found",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorResponse"
                        }
                    }
                }
            },
            "ConflictError": {
                "description": "Conflict",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorResponse"
                        }
                    }
                }
            },
            "InternalServerError": {
                "description": "Internal server error",
                "content": {
                    "application/json": {
                        "schema": {
                            "$ref": "#/components/schemas/ErrorResponse"
                        }
                    }
                }
            }
        },
        "schemas": {
            "ApiRootResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "status",
                    "version",
                    "docs",
                    "developer",
                    "timestamp"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string",
                        "example": "API is live"
                    },
                    "status": {
                        "type": "string",
                        "example": "ok"
                    },
                    "version": {
                        "type": "string",
                        "example": "1.0.0"
                    },
                    "docs": {
                        "type": "string",
                        "format": "uri"
                    },
                    "developer": {
                        "type": "string"
                    },
                    "timestamp": {
                        "type": "string",
                        "format": "date-time"
                    }
                }
            },
            "ErrorResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "BAD_REQUEST"
                    },
                    "message": {
                        "type": "string",
                        "example": "Invalid request"
                    },
                    "error": {
                        "description": "Optional debug payload",
                        "anyOf": [
                            {
                                "type": "object"
                            },
                            {
                                "type": "null"
                            }
                        ]
                    }
                }
            },
            "ValidationErrorIssue": {
                "type": "object",
                "required": [
                    "path",
                    "message"
                ],
                "properties": {
                    "path": {
                        "type": "string",
                        "example": "email"
                    },
                    "message": {
                        "type": "string",
                        "example": "Email is required"
                    }
                }
            },
            "ValidationErrorResponse": {
                "type": "object",
                "required": [
                    "code",
                    "errors"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "BAD_REQUEST"
                    },
                    "errors": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/ValidationErrorIssue"
                        }
                    }
                }
            },
            "UserType": {
                "type": "string",
                "enum": [
                    "MEMBER",
                    "OFFICER",
                    "ADMIN"
                ]
            },
            "OfficeTitleLevel": {
                "type": "string",
                "enum": [
                    "CHIEF_CHAPLAIN",
                    "NATIONAL_CHAPLAIN_DIRECTOR",
                    "REGIONAL_CHAPLAIN_DIRECTOR",
                    "REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR",
                    "PROVINCIAL_CHAPLAIN_DIRECTOR",
                    "PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR",
                    "CITY_CHAPLAIN",
                    "MUNICIPAL_CHAPLAIN",
                    "CITY_MUNICIPAL_DEPUTY_CHAPLAIN",
                    "BARANGAY_CHAPLAIN",
                    "BARANGAY_DEPUTY_CHAPLAIN"
                ]
            },
            "MemberStatus": {
                "type": "string",
                "enum": [
                    "PENDING",
                    "APPROVED",
                    "REJECTED"
                ]
            },
            "CivilStatus": {
                "type": "string",
                "enum": [
                    "SINGLE",
                    "MARRIED",
                    "WIDOWED",
                    "SEPARATED",
                    "ANNULLED"
                ]
            },
            "Gender": {
                "type": "string",
                "enum": [
                    "MALE",
                    "FEMALE",
                    "PREFER_NOT_TO_SAY"
                ]
            },
            "SignatureType": {
                "type": "string",
                "enum": [
                    "DRAWN",
                    "UPLOADED"
                ]
            },
            "UserPublic": {
                "type": "object",
                "required": [
                    "id",
                    "name",
                    "email",
                    "role",
                    "createdAt"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "name": {
                        "type": "string"
                    },
                    "email": {
                        "type": "string",
                        "format": "email"
                    },
                    "avatar": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "role": {
                        "$ref": "#/components/schemas/UserType"
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updatedAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "isEmailVerified": {
                        "type": "boolean"
                    },
                    "isTwoFactorEnabled": {
                        "type": "boolean"
                    }
                }
            },
            "UserEnvelopeResponse": {
                "type": "object",
                "required": [
                    "user"
                ],
                "properties": {
                    "user": {
                        "$ref": "#/components/schemas/UserPublic"
                    }
                }
            },
            "UserListResponse": {
                "type": "object",
                "required": [
                    "total",
                    "users"
                ],
                "properties": {
                    "total": {
                        "type": "integer"
                    },
                    "limit": {
                        "type": "integer"
                    },
                    "offset": {
                        "type": "integer"
                    },
                    "totalPages": {
                        "type": "integer"
                    },
                    "currentPage": {
                        "type": "integer"
                    },
                    "hasMore": {
                        "type": "boolean"
                    },
                    "users": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/UserPublic"
                        }
                    }
                }
            },
            "RegisterRequest": {
                "type": "object",
                "required": [
                    "name",
                    "email",
                    "password",
                    "role"
                ],
                "properties": {
                    "name": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "email": {
                        "type": "string",
                        "format": "email",
                        "maxLength": 255
                    },
                    "password": {
                        "type": "string",
                        "minLength": 8,
                        "maxLength": 255,
                        "description": "Must include at least 1 uppercase letter, 1 number, and 1 special character"
                    },
                    "role": {
                        "$ref": "#/components/schemas/UserType"
                    }
                }
            },
            "LoginRequest": {
                "type": "object",
                "required": [
                    "email",
                    "password"
                ],
                "properties": {
                    "email": {
                        "type": "string",
                        "format": "email"
                    },
                    "password": {
                        "type": "string",
                        "minLength": 8,
                        "maxLength": 255
                    },
                    "userAgent": {
                        "type": "string"
                    }
                }
            },
            "AuthSuccessResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "user"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "user": {
                        "$ref": "#/components/schemas/UserPublic"
                    },
                    "accessToken": {
                        "type": "string"
                    },
                    "mfaRequired": {
                        "type": "boolean"
                    },
                    "mfaToken": {
                        "type": "string"
                    }
                }
            },
            "RefreshTokenResponse": {
                "type": "object",
                "required": [
                    "accessToken"
                ],
                "properties": {
                    "accessToken": {
                        "type": "string"
                    }
                }
            },
            "ForgotPasswordRequest": {
                "type": "object",
                "required": [
                    "email"
                ],
                "properties": {
                    "email": {
                        "type": "string",
                        "format": "email"
                    }
                }
            },
            "ResetPasswordRequest": {
                "type": "object",
                "required": [
                    "password",
                    "confirmPassword"
                ],
                "properties": {
                    "password": {
                        "type": "string",
                        "minLength": 8,
                        "maxLength": 255
                    },
                    "confirmPassword": {
                        "type": "string",
                        "minLength": 8,
                        "maxLength": 255
                    }
                }
            },
            "VerifyEmailRequest": {
                "type": "object",
                "required": [
                    "code"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "minLength": 1
                    }
                }
            },
            "VerifyEmailResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "user"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "user": {
                        "$ref": "#/components/schemas/UserPublic"
                    }
                }
            },
            "ResendVerificationRequest": {
                "type": "object",
                "required": [
                    "email"
                ],
                "properties": {
                    "email": {
                        "type": "string",
                        "format": "email"
                    }
                }
            },
            "UpdateCurrentUserRequest": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "name": {
                        "type": "string"
                    },
                    "email": {
                        "type": "string",
                        "format": "email"
                    },
                    "avatar": {
                        "type": [
                            "string",
                            "null"
                        ]
                    }
                }
            },
            "MinisterialExperienceResource": {
                "type": "object",
                "required": [
                    "id",
                    "roleDescription",
                    "yearsApprox",
                    "order",
                    "memberId",
                    "createdAt",
                    "updatedAt"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "roleDescription": {
                        "type": "string"
                    },
                    "yearsApprox": {
                        "type": "string"
                    },
                    "order": {
                        "type": "integer"
                    },
                    "memberId": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updatedAt": {
                        "type": "string",
                        "format": "date-time"
                    }
                }
            },
            "CharacterReferenceResource": {
                "type": "object",
                "required": [
                    "id",
                    "name",
                    "positionRelationship",
                    "contactNumber",
                    "order",
                    "memberId",
                    "createdAt",
                    "updatedAt"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "name": {
                        "type": "string"
                    },
                    "positionRelationship": {
                        "type": "string"
                    },
                    "contactNumber": {
                        "type": "string"
                    },
                    "order": {
                        "type": "integer"
                    },
                    "memberId": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updatedAt": {
                        "type": "string",
                        "format": "date-time"
                    }
                }
            },
            "ApplicantSignatureResource": {
                "type": "object",
                "required": [
                    "id",
                    "type",
                    "signatureData",
                    "memberId",
                    "createdAt",
                    "updatedAt"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "type": {
                        "$ref": "#/components/schemas/SignatureType"
                    },
                    "signatureData": {
                        "type": "string"
                    },
                    "memberId": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updatedAt": {
                        "type": "string",
                        "format": "date-time"
                    }
                }
            },
            "PreferredBranchResource": {
                "type": "object",
                "required": [
                    "id",
                    "title"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "title": {
                        "type": "string"
                    }
                }
            },
            "MemberUserResource": {
                "type": "object",
                "required": [
                    "id",
                    "name",
                    "email",
                    "role"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "name": {
                        "type": "string"
                    },
                    "email": {
                        "type": "string",
                        "format": "email"
                    },
                    "role": {
                        "$ref": "#/components/schemas/UserType"
                    }
                }
            },
            "MemberResource": {
                "type": "object",
                "required": [
                    "id",
                    "userId",
                    "status",
                    "firstName",
                    "lastName",
                    "mobilePhoneNumber",
                    "homeAddress",
                    "civilStatus",
                    "gender",
                    "nationality",
                    "dateOfBirth",
                    "region",
                    "province",
                    "municipalityCity",
                    "barangay",
                    "emergencyContactName",
                    "emergencyContactMobile",
                    "churchAffiliation",
                    "churchAddress",
                    "currentPositionRole",
                    "isActive",
                    "createdAt",
                    "updatedAt"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "userId": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "status": {
                        "$ref": "#/components/schemas/MemberStatus"
                    },
                    "firstName": {
                        "type": "string"
                    },
                    "lastName": {
                        "type": "string"
                    },
                    "mobilePhoneNumber": {
                        "type": "string"
                    },
                    "homeAddress": {
                        "type": "string"
                    },
                    "civilStatus": {
                        "$ref": "#/components/schemas/CivilStatus"
                    },
                    "gender": {
                        "$ref": "#/components/schemas/Gender"
                    },
                    "nationality": {
                        "type": "string"
                    },
                    "dateOfBirth": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "region": {
                        "type": "string"
                    },
                    "province": {
                        "type": "string"
                    },
                    "municipalityCity": {
                        "type": "string"
                    },
                    "barangay": {
                        "type": "string"
                    },
                    "emergencyContactName": {
                        "type": "string"
                    },
                    "emergencyContactMobile": {
                        "type": "string"
                    },
                    "recentIdPhotoUrl": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "format": "uri"
                    },
                    "churchAffiliation": {
                        "type": "string"
                    },
                    "churchAddress": {
                        "type": "string"
                    },
                    "currentPositionRole": {
                        "type": "string"
                    },
                    "currentPositionRoleOther": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "height": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "weight": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "bloodType": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "colorOfEyes": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "colorOfSkin": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "sssNumber": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "tinNumber": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "skillsTalents": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "preferredBranchOther": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "elementarySchool": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "secondarySchool": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "tertiaryCollege": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "postGraduateStudies": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "isActive": {
                        "type": "boolean"
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updatedAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "user": {
                        "$ref": "#/components/schemas/MemberUserResource"
                    },
                    "preferredBranches": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/PreferredBranchResource"
                        }
                    },
                    "ministerialExperiences": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/MinisterialExperienceResource"
                        }
                    },
                    "characterReferences": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/CharacterReferenceResource"
                        }
                    },
                    "signature": {
                        "anyOf": [
                            {
                                "$ref": "#/components/schemas/ApplicantSignatureResource"
                            },
                            {
                                "type": "null"
                            }
                        ]
                    }
                }
            },
            "ApplyMemberMinisterialExperienceItem": {
                "type": "object",
                "required": [
                    "roleDescription",
                    "yearsApprox"
                ],
                "properties": {
                    "roleDescription": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 255
                    },
                    "yearsApprox": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    }
                }
            },
            "ApplyMemberCharacterReferenceItem": {
                "type": "object",
                "required": [
                    "name",
                    "positionRelationship",
                    "contactNumber"
                ],
                "properties": {
                    "name": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "positionRelationship": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 255
                    },
                    "contactNumber": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 50
                    }
                }
            },
            "ApplyMemberSignature": {
                "type": "object",
                "required": [
                    "type",
                    "signatureData"
                ],
                "properties": {
                    "type": {
                        "$ref": "#/components/schemas/SignatureType"
                    },
                    "signatureData": {
                        "type": "string",
                        "minLength": 1
                    }
                }
            },
            "ApplyMemberRequest": {
                "type": "object",
                "required": [
                    "firstName",
                    "lastName",
                    "mobilePhoneNumber",
                    "homeAddress",
                    "civilStatus",
                    "gender",
                    "nationality",
                    "dateOfBirth",
                    "region",
                    "province",
                    "municipalityCity",
                    "barangay",
                    "emergencyContactName",
                    "emergencyContactMobile",
                    "churchAffiliation",
                    "churchAddress",
                    "currentPositionRole"
                ],
                "properties": {
                    "firstName": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "lastName": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "mobilePhoneNumber": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 30
                    },
                    "homeAddress": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 255
                    },
                    "civilStatus": {
                        "$ref": "#/components/schemas/CivilStatus"
                    },
                    "gender": {
                        "$ref": "#/components/schemas/Gender"
                    },
                    "nationality": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "dateOfBirth": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "region": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "province": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "municipalityCity": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "barangay": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "emergencyContactName": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "emergencyContactMobile": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 30
                    },
                    "recentIdPhotoUrl": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "format": "uri"
                    },
                    "churchAffiliation": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 150
                    },
                    "churchAddress": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 255
                    },
                    "currentPositionRole": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 150
                    },
                    "currentPositionRoleOther": {
                        "type": "string",
                        "maxLength": 150
                    },
                    "height": {
                        "type": "string",
                        "maxLength": 30
                    },
                    "weight": {
                        "type": "string",
                        "maxLength": 30
                    },
                    "bloodType": {
                        "type": "string",
                        "maxLength": 10
                    },
                    "colorOfEyes": {
                        "type": "string",
                        "maxLength": 50
                    },
                    "colorOfSkin": {
                        "type": "string",
                        "maxLength": 50
                    },
                    "sssNumber": {
                        "type": "string",
                        "maxLength": 50
                    },
                    "tinNumber": {
                        "type": "string",
                        "maxLength": 50
                    },
                    "skillsTalents": {
                        "type": "string",
                        "maxLength": 500
                    },
                    "preferredBranchIds": {
                        "type": "array",
                        "maxItems": 20,
                        "items": {
                            "type": "string",
                            "format": "uuid"
                        }
                    },
                    "preferredBranchOther": {
                        "type": "string",
                        "maxLength": 255
                    },
                    "elementarySchool": {
                        "type": "string",
                        "maxLength": 150
                    },
                    "secondarySchool": {
                        "type": "string",
                        "maxLength": 150
                    },
                    "tertiaryCollege": {
                        "type": "string",
                        "maxLength": 150
                    },
                    "postGraduateStudies": {
                        "type": "string",
                        "maxLength": 150
                    },
                    "ministerialExperiences": {
                        "type": "array",
                        "maxItems": 20,
                        "items": {
                            "$ref": "#/components/schemas/ApplyMemberMinisterialExperienceItem"
                        }
                    },
                    "characterReferences": {
                        "type": "array",
                        "maxItems": 20,
                        "items": {
                            "$ref": "#/components/schemas/ApplyMemberCharacterReferenceItem"
                        }
                    },
                    "signature": {
                        "$ref": "#/components/schemas/ApplyMemberSignature"
                    }
                }
            },
            "UpdateMemberStatusRequest": {
                "type": "object",
                "required": [
                    "status"
                ],
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": [
                            "APPROVED",
                            "REJECTED"
                        ]
                    }
                }
            },
            "MemberReadResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "$ref": "#/components/schemas/MemberResource"
                    }
                }
            },
            "MemberWriteResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "$ref": "#/components/schemas/MemberResource"
                    }
                }
            },
            "MemberListResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data",
                    "pagination"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/MemberResource"
                        }
                    },
                    "pagination": {
                        "$ref": "#/components/schemas/Pagination"
                    }
                }
            },
            "SectionItem": {
                "type": "object",
                "required": [
                    "content"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "content": {
                        "type": "string",
                        "minLength": 1
                    }
                }
            },
            "Section": {
                "type": "object",
                "required": [
                    "title",
                    "type"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "title": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "type": {
                        "type": "string",
                        "enum": [
                            "list",
                            "richtext"
                        ]
                    },
                    "items": {
                        "type": "array",
                        "maxItems": 50,
                        "items": {
                            "$ref": "#/components/schemas/SectionItem"
                        }
                    },
                    "content": {
                        "type": "string",
                        "maxLength": 20000
                    }
                }
            },
            "BranchServiceResource": {
                "type": "object",
                "required": [
                    "id",
                    "title",
                    "description",
                    "sections",
                    "createdAt",
                    "updatedAt"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "title": {
                        "type": "string"
                    },
                    "description": {
                        "type": "string"
                    },
                    "sections": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/Section"
                        }
                    },
                    "memberId": {
                        "anyOf": [
                            {
                                "type": "string",
                                "format": "uuid"
                            },
                            {
                                "type": "null"
                            }
                        ]
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updatedAt": {
                        "type": "string",
                        "format": "date-time"
                    }
                }
            },
            "CreateBranchServiceRequest": {
                "type": "object",
                "required": [
                    "title",
                    "description",
                    "sections"
                ],
                "properties": {
                    "title": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "description": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 1000
                    },
                    "sections": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 20,
                        "items": {
                            "$ref": "#/components/schemas/Section"
                        }
                    }
                }
            },
            "UpdateBranchServiceRequest": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "title": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "description": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 1000
                    },
                    "sections": {
                        "type": "array",
                        "minItems": 1,
                        "maxItems": 20,
                        "items": {
                            "$ref": "#/components/schemas/Section"
                        }
                    }
                }
            },
            "Pagination": {
                "type": "object",
                "required": [
                    "currentPage",
                    "totalPages",
                    "totalCount",
                    "limit",
                    "hasNextPage",
                    "hasPreviousPage"
                ],
                "properties": {
                    "currentPage": {
                        "type": "integer"
                    },
                    "totalPages": {
                        "type": "integer"
                    },
                    "totalCount": {
                        "type": "integer"
                    },
                    "limit": {
                        "type": "integer"
                    },
                    "hasNextPage": {
                        "type": "boolean"
                    },
                    "hasPreviousPage": {
                        "type": "boolean"
                    }
                }
            },
            "BranchServiceReadResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "$ref": "#/components/schemas/BranchServiceResource"
                    }
                }
            },
            "BranchServiceWriteResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "$ref": "#/components/schemas/BranchServiceResource"
                    }
                }
            },
            "BranchServiceListResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data",
                    "pagination"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/BranchServiceResource"
                        }
                    },
                    "pagination": {
                        "$ref": "#/components/schemas/Pagination"
                    }
                }
            },
            "OfficeResource": {
                "type": "object",
                "required": [
                    "id",
                    "name",
                    "level",
                    "sections",
                    "createdAt",
                    "updatedAt"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "name": {
                        "type": "string"
                    },
                    "level": {
                        "$ref": "#/components/schemas/OfficeTitleLevel"
                    },
                    "description": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "maxSlots": {
                        "type": [
                            "integer",
                            "null"
                        ]
                    },
                    "sections": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/Section"
                        }
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "updatedAt": {
                        "type": "string",
                        "format": "date-time"
                    }
                }
            },
            "CreateOfficeRequest": {
                "type": "object",
                "required": [
                    "level"
                ],
                "additionalProperties": false,
                "anyOf": [
                    {
                        "required": [
                            "name"
                        ]
                    },
                    {
                        "required": [
                            "title"
                        ]
                    }
                ],
                "properties": {
                    "name": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "title": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "description": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "minLength": 1,
                        "maxLength": 1000
                    },
                    "sections": {
                        "type": "array",
                        "maxItems": 20,
                        "items": {
                            "$ref": "#/components/schemas/Section"
                        }
                    },
                    "level": {
                        "$ref": "#/components/schemas/OfficeTitleLevel"
                    },
                    "maxSlots": {
                        "type": [
                            "integer",
                            "null"
                        ],
                        "minimum": 1
                    }
                }
            },
            "UpdateOfficeRequest": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                    "name": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "title": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    },
                    "description": {
                        "type": [
                            "string",
                            "null"
                        ],
                        "minLength": 1,
                        "maxLength": 1000
                    },
                    "sections": {
                        "type": "array",
                        "maxItems": 20,
                        "items": {
                            "$ref": "#/components/schemas/Section"
                        }
                    },
                    "level": {
                        "$ref": "#/components/schemas/OfficeTitleLevel"
                    },
                    "maxSlots": {
                        "type": [
                            "integer",
                            "null"
                        ],
                        "minimum": 1
                    }
                }
            },
            "OfficeReadResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "$ref": "#/components/schemas/OfficeResource"
                    }
                }
            },
            "OfficeWriteResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "$ref": "#/components/schemas/OfficeResource"
                    }
                }
            },
            "OfficeListResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data",
                    "pagination"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "type": "array",
                        "items": {
                            "$ref": "#/components/schemas/OfficeResource"
                        }
                    },
                    "pagination": {
                        "$ref": "#/components/schemas/Pagination"
                    }
                }
            },
            "StatusResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    }
                }
            },
            "TwoFactorSetupData": {
                "type": "object",
                "required": [
                    "secret",
                    "otpauthUrl",
                    "qrCodeDataUrl"
                ],
                "properties": {
                    "secret": {
                        "type": "string"
                    },
                    "otpauthUrl": {
                        "type": "string"
                    },
                    "qrCodeDataUrl": {
                        "type": "string"
                    }
                }
            },
            "TwoFactorSetupResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "$ref": "#/components/schemas/TwoFactorSetupData"
                    }
                }
            },
            "TwoFactorEnableRequest": {
                "type": "object",
                "required": [
                    "token"
                ],
                "properties": {
                    "token": {
                        "type": "string",
                        "pattern": "^\\d{6}$"
                    }
                }
            },
            "VerifyTwoFactorRequest": {
                "type": "object",
                "required": [
                    "mfaToken",
                    "token"
                ],
                "properties": {
                    "mfaToken": {
                        "type": "string"
                    },
                    "token": {
                        "type": "string",
                        "pattern": "^\\d{6}$"
                    },
                    "userAgent": {
                        "type": "string"
                    }
                }
            },
            "PasskeyStatusResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "type": "object",
                        "required": [
                            "hasPasskey",
                            "count"
                        ],
                        "properties": {
                            "hasPasskey": {
                                "type": "boolean"
                            },
                            "count": {
                                "type": "integer"
                            }
                        }
                    }
                }
            },
            "PasskeyRegistrationOptionsRequest": {
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "minLength": 1,
                        "maxLength": 100
                    }
                }
            },
            "PasskeyRegistrationOptionsResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "type": "object",
                        "required": [
                            "options"
                        ],
                        "properties": {
                            "options": {
                                "type": "object",
                                "additionalProperties": true
                            },
                            "label": {
                                "type": [
                                    "string",
                                    "null"
                                ]
                            }
                        }
                    }
                }
            },
            "PasskeyRegistrationVerifyRequest": {
                "type": "object",
                "required": [
                    "response"
                ],
                "properties": {
                    "response": {
                        "type": "object",
                        "additionalProperties": true
                    }
                }
            },
            "PasskeyAuthenticationOptionsRequest": {
                "type": "object",
                "required": [
                    "email"
                ],
                "properties": {
                    "email": {
                        "type": "string",
                        "format": "email"
                    }
                }
            },
            "PasskeyAuthenticationOptionsResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "type": "object",
                        "required": [
                            "options"
                        ],
                        "properties": {
                            "options": {
                                "type": "object",
                                "additionalProperties": true
                            }
                        }
                    }
                }
            },
            "PasskeyAuthenticationVerifyRequest": {
                "type": "object",
                "required": [
                    "email",
                    "response"
                ],
                "properties": {
                    "email": {
                        "type": "string",
                        "format": "email"
                    },
                    "response": {
                        "type": "object",
                        "additionalProperties": true
                    },
                    "userAgent": {
                        "type": "string"
                    }
                }
            },
            "SessionLocation": {
                "type": "object",
                "required": [
                    "city",
                    "region",
                    "country",
                    "label",
                    "coordinates"
                ],
                "properties": {
                    "city": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "region": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "country": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "label": {
                        "type": "string"
                    },
                    "coordinates": {
                        "anyOf": [
                            {
                                "type": "object",
                                "required": [
                                    "lat",
                                    "lng"
                                ],
                                "properties": {
                                    "lat": {
                                        "type": "number"
                                    },
                                    "lng": {
                                        "type": "number"
                                    }
                                }
                            },
                            {
                                "type": "null"
                            }
                        ]
                    }
                }
            },
            "UserSessionResource": {
                "type": "object",
                "required": [
                    "id",
                    "ipAddress",
                    "userAgent",
                    "createdAt",
                    "expiredAt",
                    "isCurrent",
                    "location"
                ],
                "properties": {
                    "id": {
                        "type": "string",
                        "format": "uuid"
                    },
                    "ipAddress": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "userAgent": {
                        "type": [
                            "string",
                            "null"
                        ]
                    },
                    "createdAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "expiredAt": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "isCurrent": {
                        "type": "boolean"
                    },
                    "location": {
                        "$ref": "#/components/schemas/SessionLocation"
                    }
                }
            },
            "UserSessionsResponse": {
                "type": "object",
                "required": [
                    "code",
                    "message",
                    "data"
                ],
                "properties": {
                    "code": {
                        "type": "string",
                        "example": "OK"
                    },
                    "message": {
                        "type": "string"
                    },
                    "data": {
                        "type": "object",
                        "required": [
                            "currentSession",
                            "sessions"
                        ],
                        "properties": {
                            "currentSession": {
                                "anyOf": [
                                    {
                                        "$ref": "#/components/schemas/UserSessionResource"
                                    },
                                    {
                                        "type": "null"
                                    }
                                ]
                            },
                            "sessions": {
                                "type": "array",
                                "items": {
                                    "$ref": "#/components/schemas/UserSessionResource"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
exports.default = openApiDocument;
