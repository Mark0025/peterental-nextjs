'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, UserPlus, Users as UsersIcon } from 'lucide-react'
import { useUser } from '@/lib/hooks/use-user'

export function UserSelector() {
  const {
    userId: currentUserId,
    availableUsers,
    switchUser,
    removeUser,
    setUser,
  } = useUser()
  
  const [newUserEmail, setNewUserEmail] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddUser = () => {
    if (!newUserEmail.trim()) return
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUserEmail)) {
      alert('Please enter a valid email address')
      return
    }
    
    setUser(newUserEmail.trim())
    setNewUserEmail('')
    setIsAdding(false)
    
    console.log('[UserSelector] User added:', newUserEmail)
  }

  const handleSwitchUser = (userId: string) => {
    switchUser(userId)
    console.log('[UserSelector] Switched to user:', userId)
  }

  const handleRemoveUser = (userId: string) => {
    if (confirm(`Remove user ${userId}?`)) {
      removeUser(userId)
      console.log('[UserSelector] User removed:', userId)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Switch between users or add a new user
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add User Form */}
        {isAdding && (
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Add New User</p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddUser()
                }}
              />
              <Button onClick={handleAddUser}>Add</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setNewUserEmail('')
                }}
              >
                Cancel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the email address that will be used for Microsoft Calendar OAuth
            </p>
          </div>
        )}

        {/* Available Users List */}
        {availableUsers.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Available Users ({availableUsers.length})</p>
            <div className="space-y-2">
              {availableUsers.map((userId) => (
                <div
                  key={userId}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{userId}</span>
                    {userId === currentUserId && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {userId !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSwitchUser(userId)}
                      >
                        Switch
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(userId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No users added yet</p>
            <p className="text-xs mt-1">Click &quot;Add User&quot; to get started</p>
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-blue-900">
            <strong>Multi-User Support:</strong> You can add multiple users and switch
            between them. Each user will have their own calendar connection and data.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

