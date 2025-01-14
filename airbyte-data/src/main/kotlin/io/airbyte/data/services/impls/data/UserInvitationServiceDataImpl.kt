package io.airbyte.data.services.impls.data

import io.airbyte.config.ConfigSchema
import io.airbyte.config.ScopeType
import io.airbyte.config.UserInvitation
import io.airbyte.data.exceptions.ConfigNotFoundException
import io.airbyte.data.repositories.PermissionRepository
import io.airbyte.data.repositories.UserInvitationRepository
import io.airbyte.data.repositories.entities.Permission
import io.airbyte.data.services.InvitationStatusUnexpectedException
import io.airbyte.data.services.UserInvitationService
import io.airbyte.data.services.impls.data.mappers.EntityInvitationStatus
import io.airbyte.data.services.impls.data.mappers.EntityScopeType
import io.airbyte.data.services.impls.data.mappers.toConfigModel
import io.airbyte.data.services.impls.data.mappers.toEntity
import io.micronaut.transaction.annotation.Transactional
import jakarta.inject.Singleton
import java.time.OffsetDateTime
import java.util.UUID

@Singleton
open class UserInvitationServiceDataImpl(
  private val userInvitationRepository: UserInvitationRepository,
  private val permissionRepository: PermissionRepository,
) : UserInvitationService {
  override fun getUserInvitationByInviteCode(inviteCode: String): UserInvitation {
    return userInvitationRepository.findByInviteCode(inviteCode).orElseThrow {
      ConfigNotFoundException(ConfigSchema.USER_INVITATION, inviteCode)
    }.toConfigModel()
  }

  override fun getPendingInvitations(
    scopeType: ScopeType,
    scopeId: UUID,
  ): List<UserInvitation> {
    return userInvitationRepository.findByStatusAndScopeTypeAndScopeId(
      EntityInvitationStatus.pending,
      scopeType.toEntity(),
      scopeId,
    ).map { it.toConfigModel() }
  }

  override fun createUserInvitation(invitation: UserInvitation): UserInvitation {
    return userInvitationRepository.save(invitation.toEntity()).toConfigModel()
  }

  @Transactional("config")
  override fun acceptUserInvitation(
    inviteCode: String,
    acceptingUserId: UUID,
  ): UserInvitation {
    // fetch the invitation by code
    val invitation =
      userInvitationRepository.findByInviteCode(inviteCode).orElseThrow {
        ConfigNotFoundException(ConfigSchema.USER_INVITATION, inviteCode)
      }

    // mark the invitation status as expired if expiresAt is in the past
    if (invitation.expiresAt.isBefore(OffsetDateTime.now())) {
      invitation.status = EntityInvitationStatus.expired
      userInvitationRepository.update(invitation)
    }

    // throw an exception if the invitation is not pending. Note that this will also
    // catch the case where the invitation is expired.
    if (invitation.status != EntityInvitationStatus.pending) {
      throw InvitationStatusUnexpectedException(
        "Expected invitation for ScopeType: ${invitation.scopeType} and ScopeId: ${invitation.scopeId} to " +
          "be PENDING, but instead it had Status: ${invitation.status}",
      )
    }

    // create a new permission record according to the invitation
    Permission(
      id = UUID.randomUUID(),
      userId = acceptingUserId,
      permissionType = invitation.permissionType,
    ).apply {
      when (invitation.scopeType) {
        EntityScopeType.organization -> organizationId = invitation.scopeId
        EntityScopeType.workspace -> workspaceId = invitation.scopeId
      }
    }.let { permissionRepository.save(it) }

    // mark the invitation as accepted
    invitation.status = EntityInvitationStatus.accepted
    invitation.acceptedByUserId = acceptingUserId
    val updatedInvitation = userInvitationRepository.update(invitation)

    return updatedInvitation.toConfigModel()
  }

  override fun declineUserInvitation(
    inviteCode: String,
    invitedUserId: UUID,
  ): UserInvitation {
    TODO("Not yet implemented")
  }

  override fun cancelUserInvitation(inviteCode: String): UserInvitation {
    TODO("Not yet implemented")
  }
}
